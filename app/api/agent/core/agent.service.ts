// ============================================================================
// E-VENDIFY: Agent Service (Orquestador Principal)
// Coordina todos los servicios del agente RAG
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import {
  AgentRequest,
  AgentResponse,
  AgentResponseMetadata,
  CustomerIdentity,
  IntentClassification,
  RAGChunk,
  ActionResult,
  ConversationMessage,
  ConversationRecord,
  AgentError,
  DEFAULT_AGENT_CONFIG,
} from '@/lib/types/agent.types';
import { IdentityService } from './identity.service';
import { RouterService } from './router.service';
import { RAGService } from './rag.service';
import { SQLService } from './sql.service';
import { LLMService } from './llm.service';
import { ActionsService } from './actions.service';

// Cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class AgentService {
  /**
   * Procesa una solicitud del agente de principio a fin
   */
  static async processRequest(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    let identity: CustomerIdentity | null = null;
    let intentClassification: IntentClassification | null = null;
    let ragChunks: RAGChunk[] = [];
    let sqlContext: string | null = null;
    let actionResults: ActionResult[] = [];

    try {
      // =====================================================================
      // 1. RESOLUCIÓN DE IDENTIDAD
      // =====================================================================
      console.log(`[Agent] Processing request from ${request.phoneNumber}`);

      identity = await IdentityService.resolveIdentity(
        request.phoneNumber,
        request.storeId
      );

      console.log(`[Agent] Identity resolved: ${identity.customerName || 'Unknown'}`);

      // =====================================================================
      // 2. VERIFICAR RATE LIMIT
      // =====================================================================
      if (DEFAULT_AGENT_CONFIG.enableRateLimit) {
        const withinLimit = await IdentityService.checkRateLimit(
          request.phoneNumber,
          request.storeId,
          DEFAULT_AGENT_CONFIG.rateLimitWindowMinutes,
          DEFAULT_AGENT_CONFIG.rateLimitMaxMessages
        );

        if (!withinLimit) {
          throw new AgentError(
            'Has enviado muchos mensajes. Por favor espera unos minutos.',
            'RATE_LIMIT_EXCEEDED'
          );
        }

        // Incrementar contador
        await IdentityService.incrementRateLimit(
          request.phoneNumber,
          request.storeId,
          DEFAULT_AGENT_CONFIG.rateLimitWindowMinutes
        );
      }

      // =====================================================================
      // 3. CLASIFICACIÓN DE INTENT
      // =====================================================================
      intentClassification = RouterService.classifyIntent(
        request.message,
        identity
      );

      console.log(
        `[Agent] Intent: ${intentClassification.intent} (${(intentClassification.confidence * 100).toFixed(0)}%)`
      );

      // =====================================================================
      // 4. RECOPILACIÓN DE CONTEXTO
      // =====================================================================

      // 4a. Búsqueda RAG (si aplica)
      if (['rag', 'both'].includes(intentClassification.suggestedApproach)) {
        const searchQuery = RouterService.getSearchKeywords(
          intentClassification.entities
        );

        try {
          const ragResult = await RAGService.searchProducts(
            searchQuery,
            identity.storeId,
            {
              category: intentClassification.entities.category,
              maxPrice: intentClassification.entities.maxPrice,
              onlyAvailable: true,
            }
          );

          ragChunks = ragResult.chunks;
          console.log(`[Agent] RAG: ${ragChunks.length} chunks found`);
        } catch (error) {
          console.warn('[Agent] RAG search failed:', error);
          // Continuar sin RAG
        }
      }

      // 4b. Contexto SQL (si aplica)
      if (['sql', 'both'].includes(intentClassification.suggestedApproach)) {
        try {
          const sqlResult = await SQLService.executeSQLForIntent(
            intentClassification.intent,
            intentClassification.entities,
            identity
          );

          if (sqlResult) {
            sqlContext = sqlResult.formattedText;
            console.log(`[Agent] SQL: ${sqlResult.type} context loaded`);
          }
        } catch (error) {
          console.warn('[Agent] SQL context failed:', error);
        }
      }

      // =====================================================================
      // 5. EJECUCIÓN DE ACCIONES
      // =====================================================================
      if (intentClassification.suggestedApproach === 'action' ||
          ['add_to_cart', 'remove_from_cart', 'update_cart', 'checkout', 'apply_coupon'].includes(intentClassification.intent)) {

        actionResults = await ActionsService.executeActionsForIntent(
          intentClassification.intent,
          intentClassification.entities,
          identity,
          ragChunks
        );

        console.log(`[Agent] Actions: ${actionResults.length} executed`);

        // Actualizar contexto SQL con carrito actualizado si hubo acciones de carrito
        if (actionResults.some(a => ['add_to_cart', 'remove_from_cart', 'update_cart', 'apply_coupon'].includes(a.type))) {
          const cartContext = await SQLService.getCartContext(identity);
          sqlContext = (sqlContext ? sqlContext + '\n\n' : '') + cartContext.formattedText;
        }
      }

      // =====================================================================
      // 6. OBTENER HISTORIAL DE CONVERSACIÓN
      // =====================================================================
      const conversationHistory = await this.getConversationHistory(
        identity.sessionId,
        DEFAULT_AGENT_CONFIG.conversationHistoryLimit
      );

      // =====================================================================
      // 7. GENERACIÓN DE RESPUESTA LLM
      // =====================================================================
      let llmResponse;

      try {
        llmResponse = await LLMService.generateResponse({
          identity,
          userMessage: request.message,
          intent: intentClassification.intent,
          entities: intentClassification.entities,
          ragContext: ragChunks,
          sqlContext: sqlContext || undefined,
          actionResults,
          conversationHistory,
        });
      } catch (error) {
        console.error('[Agent] LLM failed, using fallback:', error);
        llmResponse = {
          text: LLMService.getFallbackResponse(intentClassification.intent),
          model: 'fallback',
          tokensInput: 0,
          tokensOutput: 0,
          costUsd: 0,
          finishReason: 'fallback',
          latencyMs: 0,
        };
      }

      // =====================================================================
      // 8. GUARDAR MENSAJE Y RESPUESTA
      // =====================================================================
      await this.saveMessages(identity.sessionId, identity.storeId, [
        { role: 'user', content: request.message },
        { role: 'assistant', content: llmResponse.text },
      ]);

      // Abrir ventana 24h si el usuario envió mensaje
      if (DEFAULT_AGENT_CONFIG.enableWhatsApp24hWindow && !identity.withinWindow24h) {
        await IdentityService.openWindow24h(identity.sessionId);
      }

      // =====================================================================
      // 9. PERSISTIR CONVERSACIÓN (AUDITORÍA)
      // =====================================================================
      const totalLatencyMs = Date.now() - startTime;

      const conversationId = await this.persistConversation({
        sessionId: identity.sessionId,
        storeId: identity.storeId,
        phoneNumber: identity.phoneNumber,
        userMessage: request.message,
        agentResponse: llmResponse.text,
        intent: intentClassification.intent,
        intentConfidence: intentClassification.confidence,
        entities: intentClassification.entities,
        ragQuery: RouterService.getSearchKeywords(intentClassification.entities),
        ragChunksUsed: ragChunks,
        actionsExecuted: actionResults,
        llmModel: llmResponse.model,
        llmTokensInput: llmResponse.tokensInput,
        llmTokensOutput: llmResponse.tokensOutput,
        llmCostUsd: llmResponse.costUsd,
        totalLatencyMs,
      });

      // =====================================================================
      // 10. CONSTRUIR RESPUESTA
      // =====================================================================
      const metadata: AgentResponseMetadata = {
        conversationId,
        sessionId: identity.sessionId,
        intent: intentClassification.intent,
        intentConfidence: intentClassification.confidence,
        entities: intentClassification.entities,
        ragChunksUsed: ragChunks,
        sqlQueriesExecuted: sqlContext ? ['context_query'] : undefined,
        actionsExecuted: actionResults,
        llmModel: llmResponse.model,
        llmTokensInput: llmResponse.tokensInput,
        llmTokensOutput: llmResponse.tokensOutput,
        llmCostUsd: llmResponse.costUsd,
        totalLatencyMs,
      };

      console.log(`[Agent] Response generated in ${totalLatencyMs}ms`);

      return {
        text: llmResponse.text,
        actions: [], // Para acciones futuras del cliente (botones, etc.)
        metadata,
        delivery: {
          withinWindow24h: identity.withinWindow24h || true, // Usuario envió mensaje
          templateRequired: false,
        },
      };
    } catch (error) {
      console.error('[Agent] Processing error:', error);

      // Manejar errores conocidos
      if (error instanceof AgentError) {
        return this.buildErrorResponse(error, identity, intentClassification);
      }

      // Error desconocido
      return {
        text: 'Lo siento, tuve un problema procesando tu mensaje. Por favor intenta de nuevo.',
        metadata: {
          conversationId: '',
          sessionId: identity?.sessionId || '',
          intent: intentClassification?.intent || 'unknown',
          intentConfidence: 0,
          entities: {},
          ragChunksUsed: [],
          actionsExecuted: [],
          llmModel: 'error',
          llmTokensInput: 0,
          llmTokensOutput: 0,
          llmCostUsd: 0,
          totalLatencyMs: Date.now() - startTime,
        },
        delivery: {
          withinWindow24h: true,
          templateRequired: false,
        },
      };
    }
  }

  /**
   * Obtiene el historial de conversación
   */
  private static async getConversationHistory(
    sessionId: string,
    limit: number
  ): Promise<ConversationMessage[]> {
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('role, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data
      .reverse()
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        createdAt: msg.created_at,
      }));
  }

  /**
   * Guarda mensajes en el historial
   */
  private static async saveMessages(
    sessionId: string,
    storeId: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<void> {
    const records = messages.map((msg) => ({
      session_id: sessionId,
      store_id: storeId,
      role: msg.role,
      content: msg.content,
      created_at: new Date().toISOString(),
    }));

    await supabase.from('whatsapp_messages').insert(records);
  }

  /**
   * Persiste la conversación para auditoría
   */
  private static async persistConversation(
    record: ConversationRecord
  ): Promise<string> {
    const { data, error } = await supabase
      .from('agent_conversations')
      .insert({
        session_id: record.sessionId,
        store_id: record.storeId,
        phone_number: record.phoneNumber,
        user_message: record.userMessage,
        agent_response: record.agentResponse,
        intent: record.intent,
        intent_confidence: record.intentConfidence,
        entities: record.entities,
        rag_query: record.ragQuery,
        rag_chunks_used: record.ragChunksUsed,
        actions_executed: record.actionsExecuted,
        llm_model: record.llmModel,
        llm_tokens_input: record.llmTokensInput,
        llm_tokens_output: record.llmTokensOutput,
        llm_cost_usd: record.llmCostUsd,
        total_latency_ms: record.totalLatencyMs,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Agent] Failed to persist conversation:', error);
      return '';
    }

    return data?.id || '';
  }

  /**
   * Construye respuesta de error
   */
  private static buildErrorResponse(
    error: AgentError,
    identity: CustomerIdentity | null,
    intent: IntentClassification | null
  ): AgentResponse {
    const errorMessages: Record<string, string> = {
      RATE_LIMIT_EXCEEDED:
        'Has enviado muchos mensajes. Por favor espera unos minutos antes de continuar.',
      CUSTOMER_BLOCKED:
        'Lo siento, tu cuenta ha sido suspendida. Contacta al soporte para más información.',
      STORE_NOT_FOUND:
        'No encontré la tienda solicitada. Verifica el enlace e intenta de nuevo.',
      STORE_INACTIVE:
        'Esta tienda no está disponible actualmente. Intenta más tarde.',
    };

    return {
      text: errorMessages[error.code] || error.message,
      metadata: {
        conversationId: '',
        sessionId: identity?.sessionId || '',
        intent: intent?.intent || 'unknown',
        intentConfidence: 0,
        entities: {},
        ragChunksUsed: [],
        actionsExecuted: [],
        llmModel: 'error',
        llmTokensInput: 0,
        llmTokensOutput: 0,
        llmCostUsd: 0,
        totalLatencyMs: 0,
      },
      delivery: {
        withinWindow24h: identity?.withinWindow24h || false,
        templateRequired: !identity?.withinWindow24h,
      },
    };
  }

  /**
   * Health check del agente
   */
  static async healthCheck(): Promise<{
    healthy: boolean;
    services: Record<string, boolean>;
    errors: string[];
  }> {
    const errors: string[] = [];
    const services: Record<string, boolean> = {};

    // Check RAG
    try {
      const ragHealth = await RAGService.healthCheck();
      services.rag = ragHealth.healthy;
      services.embeddingApi = ragHealth.embeddingApi;
      services.vectorDb = ragHealth.vectorDb;
      if (!ragHealth.healthy) errors.push(...ragHealth.errors);
    } catch (e) {
      services.rag = false;
      errors.push(`RAG: ${String(e)}`);
    }

    // Check LLM
    try {
      const llmHealth = await LLMService.healthCheck();
      services.llm = llmHealth.healthy;
      if (llmHealth.error) errors.push(`LLM: ${llmHealth.error}`);
    } catch (e) {
      services.llm = false;
      errors.push(`LLM: ${String(e)}`);
    }

    // Check Database
    try {
      const { error } = await supabase
        .from('whatsapp_sessions')
        .select('id')
        .limit(1);
      services.database = !error;
      if (error) errors.push(`Database: ${error.message}`);
    } catch (e) {
      services.database = false;
      errors.push(`Database: ${String(e)}`);
    }

    const healthy = Object.values(services).every((v) => v);

    return { healthy, services, errors };
  }
}
