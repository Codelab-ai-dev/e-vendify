// ============================================================================
// E-VENDIFY: Test Agent Endpoint
// POST /api/agent/test
// Endpoint para probar el agente sin necesidad de Twilio
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { AgentService } from '../core/agent.service';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// POST - Probar el agente
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, phoneNumber, storeId } = body;

    // Validar inputs
    if (!message) {
      return NextResponse.json(
        { error: 'Se requiere el campo "message"' },
        { status: 400 }
      );
    }

    // Usar valores por defecto si no se proporcionan
    const testPhoneNumber = phoneNumber || '+5215512345678';
    let testStoreId = storeId;

    // Si no se proporciona storeId, obtener la primera tienda activa
    if (!testStoreId) {
      const { data: store } = await supabase
        .from('stores')
        .select('id, name')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!store) {
        return NextResponse.json(
          { error: 'No hay tiendas activas. Crea una tienda primero.' },
          { status: 404 }
        );
      }

      testStoreId = store.id;
      console.log(`[Test] Usando tienda: ${store.name} (${store.id})`);
    }

    console.log(`[Test] Procesando mensaje: "${message}"`);
    console.log(`[Test] Phone: ${testPhoneNumber}`);
    console.log(`[Test] Store: ${testStoreId}`);

    // Procesar con el agente
    const response = await AgentService.processRequest({
      channel: 'whatsapp',
      phoneNumber: testPhoneNumber,
      storeId: testStoreId,
      message,
      messageId: `test-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });

    // Respuesta formateada
    return NextResponse.json({
      success: true,
      response: {
        text: response.text,
        intent: response.metadata.intent,
        confidence: response.metadata.intentConfidence,
        entities: response.metadata.entities,
        productsFound: response.metadata.ragChunksUsed.length,
        products: response.metadata.ragChunksUsed.map((chunk) => ({
          title: chunk.title,
          similarity: chunk.similarity.toFixed(3),
          price: (chunk.metadata as { price?: number })?.price,
        })),
        actionsExecuted: response.metadata.actionsExecuted,
        llm: {
          model: response.metadata.llmModel,
          tokensInput: response.metadata.llmTokensInput,
          tokensOutput: response.metadata.llmTokensOutput,
          costUsd: response.metadata.llmCostUsd.toFixed(6),
        },
        latencyMs: response.metadata.totalLatencyMs,
      },
    });
  } catch (error) {
    console.error('[Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Health check y estadísticas
// ============================================================================

export async function GET() {
  try {
    // Health check del agente
    const health = await AgentService.healthCheck();

    // Obtener estadísticas básicas
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name')
      .eq('is_active', true);

    const { count: productsCount } = await supabase
      .from('store_knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('content_type', 'product');

    const { count: productsWithEmbedding } = await supabase
      .from('store_knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('content_type', 'product')
      .not('embedding', 'is', null);

    const { count: conversationsCount } = await supabase
      .from('agent_conversations')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      status: health.healthy ? 'ok' : 'unhealthy',
      services: health.services,
      errors: health.errors,
      stats: {
        activeStores: stores?.length || 0,
        stores: stores?.map((s) => ({ id: s.id, name: s.name })) || [],
        productsInKnowledgeBase: productsCount || 0,
        productsWithEmbedding: productsWithEmbedding || 0,
        totalConversations: conversationsCount || 0,
      },
      testEndpoint: {
        method: 'POST',
        body: {
          message: 'string (requerido)',
          phoneNumber: 'string (opcional, default: +5215512345678)',
          storeId: 'string (opcional, usa primera tienda activa)',
        },
        example: {
          message: 'Hola, busco zapatos negros',
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', error: String(error) },
      { status: 500 }
    );
  }
}
