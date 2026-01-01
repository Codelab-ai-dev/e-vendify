// ============================================================================
// E-VENDIFY: Sync Products to Knowledge Base
// POST /api/agent/sync
// Sincroniza productos a knowledge base y genera embeddings
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

// ============================================================================
// POST - Sincronizar productos
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { storeId } = body;

    // 1. Obtener productos (de una tienda específica o todos)
    let query = supabase
      .from('products')
      .select('id, store_id, name, description, price, category, stock_quantity, is_available, image_url, sku, moderation_status')
      .eq('is_available', true);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data: products, error: productsError } = await query;

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ message: 'No hay productos para sincronizar', synced: 0 });
    }

    console.log(`[Sync] Sincronizando ${products.length} productos...`);

    const results = [];

    for (const product of products) {
      try {
        // 2. Generar contenido de texto
        const contentText = generateContentText(product);

        // 3. Generar embedding
        console.log(`[Sync] Generando embedding para: ${product.name}`);
        const embedding = await generateEmbedding(contentText);

        // 4. Preparar metadata
        const metadata = {
          price: product.price,
          category: product.category || 'General',
          stock_quantity: product.stock_quantity || 0,
          is_available: product.is_available,
          image_url: product.image_url,
          sku: product.sku,
        };

        // 5. Verificar si ya existe
        const { data: existing } = await supabase
          .from('store_knowledge_base')
          .select('id')
          .eq('store_id', product.store_id)
          .eq('reference_id', product.id)
          .eq('content_type', 'product')
          .single();

        let kb;
        let kbError;

        // Formatear embedding como string de vector PostgreSQL: [0.1,0.2,...]
        const embeddingStr = `[${embedding.join(',')}]`;

        if (existing) {
          // Actualizar existente
          const result = await supabase
            .from('store_knowledge_base')
            .update({
              title: product.name,
              content_text: contentText,
              embedding: embeddingStr,
              metadata,
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
            .select('id')
            .single();
          kb = result.data;
          kbError = result.error;
        } else {
          // Insertar nuevo
          const result = await supabase
            .from('store_knowledge_base')
            .insert({
              store_id: product.store_id,
              content_type: 'product',
              reference_id: product.id,
              title: product.name,
              content_text: contentText,
              embedding: embeddingStr,
              metadata,
              is_active: true,
              is_auto_generated: true,
            })
            .select('id')
            .single();
          kb = result.data;
          kbError = result.error;
        }

        if (kbError) {
          console.error(`[Sync] Error en ${product.name}:`, kbError);
          results.push({ product: product.name, success: false, error: kbError.message });
        } else {
          console.log(`[Sync] ✅ ${product.name} sincronizado`);
          results.push({ product: product.name, success: true, knowledgeBaseId: kb?.id });
        }
      } catch (error) {
        console.error(`[Sync] Error en ${product.name}:`, error);
        results.push({ product: product.name, success: false, error: String(error) });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Sincronización completada: ${successful} exitosos, ${failed} fallidos`,
      synced: successful,
      failed,
      results,
    });
  } catch (error) {
    console.error('[Sync] Error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

// ============================================================================
// Funciones auxiliares
// ============================================================================

function generateContentText(product: {
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  stock_quantity?: number | null;
}): string {
  let content = product.name;

  if (product.description) {
    content += `. ${product.description}`;
  }

  content += `. Precio: $${Number(product.price).toLocaleString()} MXN`;

  if (product.category) {
    content += `. Categoría: ${product.category}`;
  }

  if (product.stock_quantity !== null && product.stock_quantity !== undefined) {
    if (product.stock_quantity > 10) {
      content += `. Disponible en stock`;
    } else if (product.stock_quantity > 0) {
      content += `. Últimas ${product.stock_quantity} unidades`;
    } else {
      content += `. Temporalmente agotado`;
    }
  }

  return content;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Embedding API error');
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// ============================================================================
// GET - Ver estado de sincronización
// ============================================================================

export async function GET() {
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_available', true);

  const { count: knowledgeCount } = await supabase
    .from('store_knowledge_base')
    .select('*', { count: 'exact', head: true })
    .eq('content_type', 'product');

  const { count: withEmbedding } = await supabase
    .from('store_knowledge_base')
    .select('*', { count: 'exact', head: true })
    .eq('content_type', 'product')
    .not('embedding', 'is', null);

  return NextResponse.json({
    status: 'ready',
    stats: {
      totalProducts: productsCount || 0,
      inKnowledgeBase: knowledgeCount || 0,
      withEmbedding: withEmbedding || 0,
      pendingSync: (productsCount || 0) - (knowledgeCount || 0),
      pendingEmbedding: (knowledgeCount || 0) - (withEmbedding || 0),
    },
    usage: {
      sync: 'POST /api/agent/sync',
      syncStore: 'POST /api/agent/sync { "storeId": "uuid" }',
    },
  });
}
