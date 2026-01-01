// ============================================================================
// E-VENDIFY: RAG Service
// Búsqueda semántica usando pgvector y OpenAI embeddings
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import {
  RAGSearchOptions,
  RAGChunk,
  RAGSearchResult,
  ContentType,
  AgentError,
  DEFAULT_AGENT_CONFIG,
} from '@/lib/types/agent.types';

// Cliente Supabase con service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configuración de OpenAI
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const EMBEDDING_MODEL = process.env.AGENT_EMBEDDING_MODEL || 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

export class RAGService {
  /**
   * Genera embedding para una query usando OpenAI
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    const startTime = Date.now();

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: EMBEDDING_MODEL,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Embedding API error');
      }

      const data = await response.json();
      const embedding = data.data[0].embedding;

      console.log(
        `[RAG] Embedding generated in ${Date.now() - startTime}ms for: "${text.substring(0, 50)}..."`
      );

      return embedding;
    } catch (error) {
      console.error('[RAG] Embedding generation failed:', error);
      throw new AgentError(
        'Error al generar embedding',
        'RAG_SEARCH_FAILED',
        { error: String(error) }
      );
    }
  }

  /**
   * Búsqueda semántica en el knowledge base de una tienda
   */
  static async searchKnowledge(
    query: string,
    storeId: string,
    options: RAGSearchOptions = {}
  ): Promise<RAGSearchResult> {
    const startTime = Date.now();

    const {
      contentTypes,
      matchThreshold = DEFAULT_AGENT_CONFIG.ragMatchThreshold,
      matchCount = DEFAULT_AGENT_CONFIG.ragMatchCount,
    } = options;

    try {
      // 1. Generar embedding de la query
      const queryEmbedding = await this.generateEmbedding(query);

      // 2. Llamar a la función RPC de búsqueda
      const { data, error } = await supabase.rpc('search_store_knowledge', {
        p_store_id: storeId,
        p_query_embedding: queryEmbedding,
        p_match_threshold: matchThreshold,
        p_match_count: matchCount,
        p_content_types: contentTypes || null,
        p_include_metadata: true,
      });

      if (error) {
        console.error('[RAG] Search error:', error);
        throw new Error(error.message);
      }

      // 3. Transformar resultados
      const chunks: RAGChunk[] = (data || []).map((row: {
        id: string;
        content_type: ContentType;
        reference_id: string | null;
        title: string;
        content_text: string;
        metadata: Record<string, unknown>;
        similarity: number;
      }) => ({
        id: row.id,
        contentType: row.content_type as ContentType,
        referenceId: row.reference_id,
        title: row.title,
        contentText: row.content_text,
        metadata: row.metadata || {},
        similarity: row.similarity,
      }));

      // 4. Calcular estadísticas
      const avgSimilarity =
        chunks.length > 0
          ? chunks.reduce((sum, c) => sum + c.similarity, 0) / chunks.length
          : 0;

      const searchTimeMs = Date.now() - startTime;

      console.log(
        `[RAG] Search completed: ${chunks.length} chunks, avg similarity: ${avgSimilarity.toFixed(3)}, time: ${searchTimeMs}ms`
      );

      return {
        chunks,
        totalFound: chunks.length,
        avgSimilarity,
        searchTimeMs,
      };
    } catch (error) {
      console.error('[RAG] Search failed:', error);
      throw new AgentError(
        'Error en búsqueda semántica',
        'RAG_SEARCH_FAILED',
        { query, error: String(error) }
      );
    }
  }

  /**
   * Búsqueda semántica especializada para productos
   */
  static async searchProducts(
    query: string,
    storeId: string,
    options: {
      category?: string;
      maxPrice?: number;
      onlyAvailable?: boolean;
      matchThreshold?: number;
      matchCount?: number;
    } = {}
  ): Promise<RAGSearchResult> {
    const startTime = Date.now();

    const {
      category,
      maxPrice,
      onlyAvailable = true,
      matchThreshold = 0.25,
      matchCount = 5,
    } = options;

    try {
      // 1. Generar embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // 2. Llamar a función RPC especializada para productos
      const { data, error } = await supabase.rpc('search_products_semantic', {
        p_store_id: storeId,
        p_query_embedding: queryEmbedding,
        p_match_threshold: matchThreshold,
        p_match_count: matchCount,
        p_category: category || null,
        p_max_price: maxPrice || null,
        p_only_available: onlyAvailable,
      });

      if (error) {
        console.error('[RAG] Product search error:', error);
        throw new Error(error.message);
      }

      // 3. Transformar a RAGChunks
      const chunks: RAGChunk[] = (data || []).map((row: {
        product_id: string;
        title: string;
        content_text: string;
        price: number;
        category: string;
        stock_quantity: number;
        is_available: boolean;
        image_url: string | null;
        similarity: number;
      }) => ({
        id: row.product_id,
        contentType: 'product' as ContentType,
        referenceId: row.product_id,
        title: row.title,
        contentText: row.content_text,
        metadata: {
          price: row.price,
          category: row.category,
          stockQuantity: row.stock_quantity,
          isAvailable: row.is_available,
          imageUrl: row.image_url,
        },
        similarity: row.similarity,
      }));

      const avgSimilarity =
        chunks.length > 0
          ? chunks.reduce((sum, c) => sum + c.similarity, 0) / chunks.length
          : 0;

      const searchTimeMs = Date.now() - startTime;

      console.log(
        `[RAG] Product search: ${chunks.length} products found, time: ${searchTimeMs}ms`
      );

      return {
        chunks,
        totalFound: chunks.length,
        avgSimilarity,
        searchTimeMs,
      };
    } catch (error) {
      console.error('[RAG] Product search failed:', error);
      throw new AgentError(
        'Error buscando productos',
        'RAG_SEARCH_FAILED',
        { query, error: String(error) }
      );
    }
  }

  /**
   * Búsqueda híbrida: semántica + keywords
   */
  static async searchHybrid(
    query: string,
    storeId: string,
    keyword?: string,
    matchCount: number = 10
  ): Promise<RAGSearchResult> {
    const startTime = Date.now();

    try {
      const queryEmbedding = await this.generateEmbedding(query);

      const { data, error } = await supabase.rpc('search_products_hybrid', {
        p_store_id: storeId,
        p_query_embedding: queryEmbedding,
        p_keyword: keyword || null,
        p_match_threshold: 0.5,
        p_match_count: matchCount,
      });

      if (error) {
        throw new Error(error.message);
      }

      const chunks: RAGChunk[] = (data || []).map((row: {
        product_id: string;
        title: string;
        content_text: string;
        price: number;
        category: string;
        image_url: string | null;
        similarity: number;
        keyword_match: boolean;
        combined_score: number;
      }) => ({
        id: row.product_id,
        contentType: 'product' as ContentType,
        referenceId: row.product_id,
        title: row.title,
        contentText: row.content_text,
        metadata: {
          price: row.price,
          category: row.category,
          imageUrl: row.image_url,
          keywordMatch: row.keyword_match,
          combinedScore: row.combined_score,
        },
        similarity: row.similarity,
      }));

      const avgSimilarity =
        chunks.length > 0
          ? chunks.reduce((sum, c) => sum + c.similarity, 0) / chunks.length
          : 0;

      return {
        chunks,
        totalFound: chunks.length,
        avgSimilarity,
        searchTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[RAG] Hybrid search failed:', error);
      throw new AgentError(
        'Error en búsqueda híbrida',
        'RAG_SEARCH_FAILED',
        { query, keyword, error: String(error) }
      );
    }
  }

  /**
   * Formatea los chunks RAG para incluir en el prompt del LLM
   */
  static formatChunksForLLM(chunks: RAGChunk[]): string {
    if (chunks.length === 0) {
      return 'No se encontraron productos o información relevante.';
    }

    const lines: string[] = ['PRODUCTOS/INFORMACIÓN ENCONTRADA:'];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      if (chunk.contentType === 'product') {
        const meta = chunk.metadata as {
          price?: number;
          stockQuantity?: number;
          isAvailable?: boolean;
          imageUrl?: string;
        };

        lines.push(`
${i + 1}. **${chunk.title}**
   - ID: ${chunk.referenceId}
   - Precio: $${meta.price?.toLocaleString()} MXN
   - Stock: ${meta.stockQuantity ?? 'N/A'} unidades
   - Disponible: ${meta.isAvailable ? 'Sí' : 'No'}
   - Descripción: ${chunk.contentText}
   - Relevancia: ${(chunk.similarity * 100).toFixed(0)}%`);
      } else {
        lines.push(`
${i + 1}. **${chunk.title}** (${chunk.contentType})
   ${chunk.contentText}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Verifica la salud del servicio RAG
   */
  static async healthCheck(): Promise<{
    healthy: boolean;
    embeddingApi: boolean;
    vectorDb: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let embeddingApi = false;
    let vectorDb = false;

    // Test embedding API
    try {
      await this.generateEmbedding('test');
      embeddingApi = true;
    } catch (e) {
      errors.push(`Embedding API: ${String(e)}`);
    }

    // Test vector DB
    try {
      const { error } = await supabase
        .from('store_knowledge_base')
        .select('id')
        .limit(1);

      if (error) throw error;
      vectorDb = true;
    } catch (e) {
      errors.push(`Vector DB: ${String(e)}`);
    }

    return {
      healthy: embeddingApi && vectorDb,
      embeddingApi,
      vectorDb,
      errors,
    };
  }
}
