// ============================================================================
// E-VENDIFY: n8n Integration
// Funciones para llamar a webhooks de n8n
// ============================================================================

const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.tu-dominio.com';
const N8N_EMBEDDINGS_PATH = '/webhook/e-vendify/embeddings';

interface EmbeddingPayload {
  knowledge_base_id: string;
  store_id: string;
  content_text: string;
  title: string;
  content_type: 'product' | 'faq' | 'policy' | 'promotion' | 'store_info' | 'custom';
  reference_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Dispara la generación de embedding para un producto/contenido
 * Llama al webhook de n8n de forma asíncrona (fire-and-forget)
 */
export async function triggerEmbeddingGeneration(
  payload: EmbeddingPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const webhookUrl = `${N8N_BASE_URL}${N8N_EMBEDDINGS_PATH}`;

    console.log(`[n8n] Triggering embedding for: ${payload.title}`);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[n8n] Webhook failed: ${errorText}`);
      return { success: false, error: errorText };
    }

    console.log(`[n8n] Embedding triggered successfully for: ${payload.title}`);
    return { success: true };
  } catch (error) {
    console.error('[n8n] Webhook error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Genera el texto de contenido para un producto
 * Optimizado para búsqueda semántica
 */
export function generateProductContentText(product: {
  name: string;
  description?: string;
  price: number;
  category?: string;
  stock_quantity?: number;
  is_available?: boolean;
}): string {
  let content = product.name;

  if (product.description) {
    content += `. ${product.description}`;
  }

  content += `. Precio: $${product.price.toLocaleString()} MXN`;

  if (product.category) {
    content += `. Categoría: ${product.category}`;
  }

  if (product.stock_quantity !== undefined) {
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

/**
 * Dispara embedding para un producto recién creado/actualizado
 * Usar después de insertar/actualizar en store_knowledge_base
 */
export async function triggerProductEmbedding(
  knowledgeBaseId: string,
  storeId: string,
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    stock_quantity?: number;
    is_available?: boolean;
    image_url?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const contentText = generateProductContentText(product);

  return triggerEmbeddingGeneration({
    knowledge_base_id: knowledgeBaseId,
    store_id: storeId,
    content_text: contentText,
    title: product.name,
    content_type: 'product',
    reference_id: product.id,
    metadata: {
      price: product.price,
      category: product.category,
      stock_quantity: product.stock_quantity,
      is_available: product.is_available,
      image_url: product.image_url,
    },
  });
}
