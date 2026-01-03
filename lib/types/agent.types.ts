// ============================================================================
// E-VENDIFY: Agent Types
// Tipos TypeScript para el agente RAG de WhatsApp
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================

export type AgentChannel = 'whatsapp' | 'web' | 'api';

export type SessionState =
  | 'idle'
  | 'browsing'
  | 'cart'
  | 'checkout'
  | 'support'
  | 'waiting_input';

export type MessageRole = 'user' | 'assistant' | 'system';

export type Intent =
  | 'greeting'
  | 'search_product'
  | 'price_inquiry'
  | 'stock_check'
  | 'add_to_cart'
  | 'view_cart'
  | 'remove_from_cart'
  | 'update_cart'
  | 'checkout'
  | 'oxxo_checkout'
  | 'apply_coupon'
  | 'order_tracking'
  | 'order_history'
  | 'faq'
  | 'store_info'
  | 'support'
  | 'farewell'
  | 'unknown';

export type ActionType =
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'update_cart_quantity'
  | 'clear_cart'
  | 'apply_coupon'
  | 'remove_coupon'
  | 'create_checkout_link'
  | 'create_oxxo_ticket'
  | 'send_product_image'
  | 'send_product_list'
  | 'escalate_to_human'
  | 'open_24h_window'
  | 'send_template';

export type ContentType =
  | 'product'
  | 'faq'
  | 'policy'
  | 'promotion'
  | 'store_info'
  | 'custom';

// ============================================================================
// REQUEST / RESPONSE
// ============================================================================

export interface AgentRequest {
  channel: AgentChannel;
  phoneNumber: string;
  storeId: string;
  message: string;
  messageId?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentResponse {
  text: string;
  actions?: AgentAction[];
  metadata: AgentResponseMetadata;
  delivery: DeliveryInfo;
}

export interface AgentResponseMetadata {
  conversationId: string;
  sessionId: string;
  intent: Intent;
  intentConfidence: number;
  entities: ExtractedEntities;
  ragChunksUsed: RAGChunk[];
  sqlQueriesExecuted?: string[];
  actionsExecuted: ActionResult[];
  llmModel: string;
  llmTokensInput: number;
  llmTokensOutput: number;
  llmCostUsd: number;
  totalLatencyMs: number;
}

export interface DeliveryInfo {
  withinWindow24h: boolean;
  templateRequired: boolean;
  templateName?: string;
}

// ============================================================================
// IDENTITY
// ============================================================================

export interface CustomerIdentity {
  customerId: string;
  phoneNumber: string;
  storeId: string;
  storeName: string;
  storeSlug: string;

  // Datos del cliente
  customerName: string | null;
  customerEmail: string | null;

  // Métricas
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;

  // Sesión actual
  sessionId: string;
  sessionState: SessionState;
  cartItemsCount: number;
  cartTotal: number;

  // Estado
  isNewCustomer: boolean;
  isBlocked: boolean;

  // Ventana 24h
  withinWindow24h: boolean;
  windowClosesAt: string | null;
}

// ============================================================================
// INTENT CLASSIFICATION
// ============================================================================

export interface IntentClassification {
  intent: Intent;
  confidence: number;
  entities: ExtractedEntities;
  suggestedApproach: 'rag' | 'sql' | 'action' | 'both' | 'llm_only';
  requiresConfirmation: boolean;
}

export interface ExtractedEntities {
  productName?: string;
  productId?: string;
  category?: string;
  quantity?: number;
  maxPrice?: number;
  minPrice?: number;
  size?: string;
  color?: string;
  orderId?: string;
  couponCode?: string;
  email?: string;
  address?: string;
  customQuery?: string;
}

// ============================================================================
// RAG
// ============================================================================

export interface RAGSearchOptions {
  contentTypes?: ContentType[];
  matchThreshold?: number;
  matchCount?: number;
  category?: string;
  maxPrice?: number;
  onlyAvailable?: boolean;
}

export interface RAGChunk {
  id: string;
  contentType: ContentType;
  referenceId: string | null;
  title: string;
  contentText: string;
  metadata: ProductMetadata | Record<string, unknown>;
  similarity: number;
}

export interface ProductMetadata {
  price: number;
  category: string;
  stockQuantity: number;
  isAvailable: boolean;
  imageUrl: string | null;
  sku: string | null;
  averageRating: number | null;
  reviewsCount: number;
}

export interface RAGSearchResult {
  chunks: RAGChunk[];
  totalFound: number;
  avgSimilarity: number;
  searchTimeMs: number;
}

// ============================================================================
// CART
// ============================================================================

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  maxStock: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  appliedCoupon: AppliedCoupon | null;
  itemCount: number;
}

export interface AppliedCoupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountApplied: number;
}

// ============================================================================
// ACTIONS
// ============================================================================

export interface AgentAction {
  type: ActionType;
  payload: Record<string, unknown>;
  description: string;
}

export interface ActionResult {
  type: ActionType;
  success: boolean;
  payload: Record<string, unknown>;
  error?: string;
  resultData?: Record<string, unknown>;
}

// ============================================================================
// LLM
// ============================================================================

export interface LLMRequest {
  identity: CustomerIdentity;
  userMessage: string;
  intent: Intent;
  entities: ExtractedEntities;
  ragContext: RAGChunk[];
  sqlContext?: string;
  actionResults?: ActionResult[];
  conversationHistory: ConversationMessage[];
}

export interface LLMResponse {
  text: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  costUsd: number;
  finishReason: string;
  latencyMs: number;
}

export interface ConversationMessage {
  role: MessageRole;
  content: string;
  createdAt: string;
}

// ============================================================================
// SQL SERVICE
// ============================================================================

export interface SQLContext {
  type: 'cart' | 'order' | 'orders_history' | 'product_stock' | 'coupon';
  data: Record<string, unknown>;
  formattedText: string;
}

// ============================================================================
// SESSION
// ============================================================================

export interface SessionUpdate {
  sessionState?: SessionState;
  cartItems?: CartItem[];
  cartTotal?: number;
  appliedCouponId?: string | null;
  appliedCouponCode?: string | null;
  discountAmount?: number;
  context?: Record<string, unknown>;
  waitingFor?: string | null;
  waitingData?: Record<string, unknown>;
}

// ============================================================================
// CONVERSATION PERSISTENCE
// ============================================================================

export interface ConversationRecord {
  sessionId: string;
  storeId: string;
  phoneNumber: string;
  userMessage: string;
  agentResponse: string;
  intent: Intent;
  intentConfidence: number;
  entities: ExtractedEntities;
  ragQuery?: string;
  ragChunksUsed: RAGChunk[];
  sqlQueriesExecuted?: string[];
  actionsExecuted: ActionResult[];
  llmModel: string;
  llmTokensInput: number;
  llmTokensOutput: number;
  llmCostUsd: number;
  totalLatencyMs: number;
}

// ============================================================================
// TWILIO
// ============================================================================

export interface TwilioWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  From: string; // whatsapp:+5215512345678
  To: string;
  Body: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  ButtonText?: string; // Para respuestas de botones
  ListId?: string; // Para respuestas de listas
  ListTitle?: string;
}

export interface TwilioMessageRequest {
  to: string;
  from: string;
  body?: string;
  mediaUrl?: string[];
  contentSid?: string; // Para templates
  contentVariables?: Record<string, string>;
}

// ============================================================================
// AGENT SERVICE CONFIG
// ============================================================================

export interface AgentConfig {
  // RAG
  ragMatchThreshold: number;
  ragMatchCount: number;

  // LLM
  llmModel: string;
  llmTemperature: number;
  llmMaxTokens: number;

  // Rate Limiting
  rateLimitWindowMinutes: number;
  rateLimitMaxMessages: number;

  // Conversation
  conversationHistoryLimit: number;

  // Features
  enableWhatsApp24hWindow: boolean;
  enableRateLimit: boolean;
  debugMode: boolean;
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  ragMatchThreshold: 0.25,
  ragMatchCount: 5,
  llmModel: 'gpt-4o-mini',
  llmTemperature: 0.3,
  llmMaxTokens: 500,
  rateLimitWindowMinutes: 10,
  rateLimitMaxMessages: 20,
  conversationHistoryLimit: 10,
  enableWhatsApp24hWindow: true,
  enableRateLimit: true,
  debugMode: process.env.NODE_ENV === 'development',
};

// ============================================================================
// ERROR TYPES
// ============================================================================

export class AgentError extends Error {
  constructor(
    message: string,
    public code: AgentErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export type AgentErrorCode =
  | 'IDENTITY_NOT_FOUND'
  | 'STORE_NOT_FOUND'
  | 'STORE_INACTIVE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CUSTOMER_BLOCKED'
  | 'RAG_SEARCH_FAILED'
  | 'LLM_FAILED'
  | 'ACTION_FAILED'
  | 'INVALID_REQUEST'
  | 'INTERNAL_ERROR';
