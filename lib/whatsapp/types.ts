// Tipos para WhatsApp Business API

export type ConversationState =
  | 'idle'
  | 'viewing_categories'
  | 'viewing_products'
  | 'viewing_cart'
  | 'entering_address'
  | 'confirming_order'
  | 'awaiting_payment'

export interface WhatsAppSession {
  id: string
  store_id: string
  phone_number: string
  customer_name: string | null
  state: ConversationState
  cart: CartItem[]
  delivery_method: 'delivery' | 'pickup' | null
  delivery_address: string | null
  current_category: string | null
  last_interaction: string
  created_at: string
}

export interface CartItem {
  product_id: string
  product_name: string
  price: number
  quantity: number
  image_url?: string
}

export interface WhatsAppConfig {
  id: string
  store_id: string
  phone_number_id: string
  access_token: string
  verify_token: string
  is_active: boolean
  welcome_message: string | null
  created_at: string
  updated_at: string
}

// Tipos de mensajes entrantes de WhatsApp
export interface IncomingMessage {
  from: string
  id: string
  timestamp: string
  type: 'text' | 'interactive' | 'button' | 'image' | 'location'
  text?: {
    body: string
  }
  interactive?: {
    type: 'button_reply' | 'list_reply'
    button_reply?: {
      id: string
      title: string
    }
    list_reply?: {
      id: string
      title: string
      description?: string
    }
  }
  location?: {
    latitude: number
    longitude: number
    name?: string
    address?: string
  }
}

export interface WhatsAppWebhookPayload {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        contacts?: Array<{
          profile: {
            name: string
          }
          wa_id: string
        }>
        messages?: IncomingMessage[]
        statuses?: Array<{
          id: string
          status: 'sent' | 'delivered' | 'read' | 'failed'
          timestamp: string
          recipient_id: string
        }>
      }
      field: string
    }>
  }>
}

// Tipos para mensajes salientes
export interface TextMessage {
  type: 'text'
  text: {
    body: string
    preview_url?: boolean
  }
}

export interface ButtonMessage {
  type: 'interactive'
  interactive: {
    type: 'button'
    header?: {
      type: 'text' | 'image'
      text?: string
      image?: { link: string }
    }
    body: {
      text: string
    }
    footer?: {
      text: string
    }
    action: {
      buttons: Array<{
        type: 'reply'
        reply: {
          id: string
          title: string // Max 20 chars
        }
      }>
    }
  }
}

export interface ListMessage {
  type: 'interactive'
  interactive: {
    type: 'list'
    header?: {
      type: 'text'
      text: string
    }
    body: {
      text: string
    }
    footer?: {
      text: string
    }
    action: {
      button: string // Max 20 chars - button text
      sections: Array<{
        title: string
        rows: Array<{
          id: string
          title: string // Max 24 chars
          description?: string // Max 72 chars
        }>
      }>
    }
  }
}

export type OutgoingMessage = TextMessage | ButtonMessage | ListMessage
