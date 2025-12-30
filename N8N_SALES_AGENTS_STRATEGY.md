# Estrategia de Integración: Agentes de Ventas con n8n

## 📋 Resumen Ejecutivo

Esta guía proporciona una estrategia paso a paso para integrar agentes de ventas automatizados usando n8n (workflow automation) en E-Vendify.

### ¿Qué es n8n?

n8n es una plataforma de automatización de workflows de código abierto que permite:
- Crear flujos de trabajo complejos sin código
- Integrar múltiples servicios (Supabase, OpenAI, WhatsApp, etc.)
- Ejecutar lógica de negocio personalizada
- Self-hosted (control total de tus datos)

### Objetivos

1. **Automatizar respuestas a clientes** - WhatsApp, email, chat web
2. **Cualificación de leads** - Identificar clientes potenciales
3. **Seguimiento automatizado** - Recordatorios y follow-ups
4. **Análisis de sentimiento** - Entender feedback de clientes
5. **Integración con IA** - Respuestas inteligentes con GPT-4/Claude

---

## 🎯 Casos de Uso Principales

### 1. Agente de Ventas por WhatsApp

**Flujo:**
```
Cliente envía mensaje → n8n recibe webhook → Analiza con IA →
Consulta productos en Supabase → Genera respuesta → Envía por WhatsApp
```

**Beneficios:**
- Respuestas 24/7
- Consulta de productos en tiempo real
- Proceso de compra guiado
- Seguimiento automático

### 2. Agente de Soporte por Email

**Flujo:**
```
Email recibido → n8n procesa → Clasifica tipo de consulta →
Responde automáticamente o asigna a humano → Actualiza CRM
```

**Beneficios:**
- Respuestas instantáneas a preguntas frecuentes
- Escalamiento inteligente
- Base de conocimiento actualizada

### 3. Lead Scoring y Nurturing

**Flujo:**
```
Nuevo lead → n8n evalúa comportamiento → Asigna score →
Ejecuta campaña de nurturing → Notifica a vendedor cuando está listo
```

**Beneficios:**
- Priorización automática de leads
- Seguimiento personalizado
- Mayor tasa de conversión

### 4. Análisis de Conversaciones

**Flujo:**
```
Conversación finalizada → n8n analiza sentimiento →
Extrae insights → Actualiza analytics → Genera reporte
```

**Beneficios:**
- Entender necesidades del cliente
- Mejorar productos/servicios
- Detectar problemas temprano

---

## 🏗️ Arquitectura de la Integración

### Diagrama de Componentes

```
┌─────────────────┐
│   E-Vendify     │
│   (Next.js)     │
└────────┬────────┘
         │
         │ Webhooks
         │ API Calls
         ▼
┌─────────────────┐
│      n8n        │
│   (Workflows)   │
├─────────────────┤
│ • WhatsApp Node │
│ • Supabase Node │
│ • OpenAI Node   │
│ • HTTP Nodes    │
│ • Scheduler     │
└────────┬────────┘
         │
         │ Queries
         ▼
┌─────────────────┐
│    Supabase     │
│   (Database)    │
└─────────────────┘
```

### Flujo de Datos

```
1. Cliente interactúa (WhatsApp/Web/Email)
   ↓
2. Sistema envía webhook a n8n
   ↓
3. n8n procesa con IA (OpenAI/Claude)
   ↓
4. n8n consulta/actualiza Supabase
   ↓
5. n8n responde al cliente
   ↓
6. n8n registra interacción en DB
```

---

## 📝 Plan de Implementación (12 Pasos)

### **FASE 1: Preparación (Semana 1)**

#### Paso 1: Instalar n8n

**Opción A: Docker (Recomendado)**
```bash
# Crear docker-compose.yml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=tu_password_seguro
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=http://tu-dominio.com
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:

# Ejecutar
docker-compose up -d
```

**Opción B: npm**
```bash
npm install n8n -g
n8n start
```

**Acceso:** http://localhost:5678

**Tiempo estimado:** 30 minutos

---

#### Paso 2: Configurar Credenciales

En n8n, ir a **Settings → Credentials** y agregar:

1. **Supabase**
   - Host: `tu-proyecto.supabase.co`
   - API Key: `tu-service-role-key` (desde Supabase Dashboard)

2. **OpenAI** (para IA)
   - API Key: `sk-...` (desde platform.openai.com)

3. **WhatsApp Business API** (opcional)
   - Token de acceso
   - Phone Number ID

**Tiempo estimado:** 20 minutos

---

#### Paso 3: Crear Tablas en Supabase

```sql
-- Tabla para conversaciones de agentes
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id),
  customer_phone TEXT,
  customer_name TEXT,
  customer_email TEXT,
  channel TEXT, -- 'whatsapp', 'web', 'email'
  status TEXT DEFAULT 'active', -- 'active', 'closed', 'waiting'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla para mensajes
CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES agent_conversations(id) ON DELETE CASCADE,
  role TEXT, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  metadata JSONB, -- Info adicional (productos mencionados, intents, etc.)
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla para leads scoring
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id),
  name TEXT,
  phone TEXT,
  email TEXT,
  score INTEGER DEFAULT 0, -- 0-100
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'lost'
  source TEXT, -- 'whatsapp', 'web', 'referral'
  notes TEXT,
  last_contact TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla para analytics de conversaciones
CREATE TABLE conversation_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES agent_conversations(id) ON DELETE CASCADE,
  sentiment TEXT, -- 'positive', 'neutral', 'negative'
  topics TEXT[], -- Array de temas mencionados
  products_mentioned UUID[], -- IDs de productos
  intent TEXT, -- 'purchase', 'inquiry', 'support', 'complaint'
  resolution TEXT, -- 'resolved', 'escalated', 'pending'
  duration_seconds INTEGER,
  message_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_conversations_store ON agent_conversations(store_id);
CREATE INDEX idx_messages_conversation ON agent_messages(conversation_id);
CREATE INDEX idx_leads_store ON leads(store_id);
CREATE INDEX idx_leads_score ON leads(score DESC);
CREATE INDEX idx_analytics_conversation ON conversation_analytics(conversation_id);

-- RLS (Row Level Security)
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_analytics ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Tiendas pueden ver sus conversaciones"
  ON agent_conversations FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM stores WHERE id = store_id));

CREATE POLICY "Tiendas pueden ver sus mensajes"
  ON agent_messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM agent_conversations
    WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  ));
```

**Tiempo estimado:** 15 minutos

---

### **FASE 2: Workflows Básicos (Semana 1-2)**

#### Paso 4: Crear Workflow de WhatsApp Bot

**Workflow: "WhatsApp Sales Agent"**

```
┌─────────────────┐
│ Webhook Trigger │ → Recibe mensaje de WhatsApp
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Set Variables  │ → Extrae datos del mensaje
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Supabase Query  │ → Busca conversación existente
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   IF Node       │ → ¿Conversación nueva?
└────┬───────┬────┘
     │       │
   YES       NO
     │       │
     ▼       ▼
┌─────────┐ ┌──────────┐
│ Create  │ │ Load     │
│ Conv.   │ │ History  │
└────┬────┘ └────┬─────┘
     │           │
     └─────┬─────┘
           ▼
    ┌─────────────────┐
    │ OpenAI GPT-4    │ → Genera respuesta inteligente
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Function Node   │ → Extrae productos mencionados
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Supabase Query  │ → Busca productos en DB
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Format Response │ → Incluye info de productos
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ WhatsApp Send   │ → Envía respuesta
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Save Message    │ → Guarda en Supabase
    └─────────────────┘
```

**Configuración detallada:**

1. **Webhook Trigger**
```json
{
  "method": "POST",
  "path": "/webhook/whatsapp/:storeId"
}
```

2. **Set Variables**
```javascript
// Code Node
return items.map(item => {
  const body = item.json.body;
  return {
    json: {
      storeId: $parameter.storeId,
      customerPhone: body.from,
      customerName: body.profile?.name || 'Cliente',
      message: body.message.text,
      timestamp: new Date().toISOString()
    }
  };
});
```

3. **OpenAI GPT-4**
```
Model: gpt-4-turbo-preview
System Message:
"Eres un asistente de ventas profesional para {{$node["Set Variables"].json["storeName"]}}.
Tu objetivo es ayudar a los clientes a encontrar productos y completar compras.
Sé amable, conciso y proactivo. Si te preguntan por productos, busca en el catálogo.
Si el cliente quiere comprar, guíalo en el proceso paso a paso."

User Message: {{$node["Set Variables"].json["message"]}}

Context (últimos 5 mensajes):
{{$node["Load History"].json["context"]}}
```

**Tiempo estimado:** 3-4 horas

---

#### Paso 5: Crear Workflow de Lead Scoring

**Workflow: "Lead Scoring & Nurturing"**

```
┌─────────────────┐
│ Schedule Trigger│ → Cada 1 hora
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Supabase Query  │ → Obtener leads sin score o desactualizados
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Loop Over Items │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Calculate Score │ → Basado en:
│                 │   • Número de interacciones
│                 │   • Tiempo desde último contacto
│                 │   • Productos consultados
│                 │   • Sentimiento de mensajes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Lead     │ → Actualiza score en Supabase
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   IF Node       │ → ¿Score > 70?
└────┬───────┬────┘
     │       │
   YES       NO
     │       │
     ▼       ▼
┌─────────┐ ┌──────────┐
│ Notify  │ │ Schedule │
│ Sales   │ │ Follow-up│
│ Team    │ │          │
└─────────┘ └──────────┘
```

**Fórmula de Scoring:**

```javascript
// Function Node - Calculate Score
const lead = $input.item.json;

let score = 0;

// Actividad reciente (+30 puntos)
const daysSinceContact = Math.floor((Date.now() - new Date(lead.last_contact)) / (1000 * 60 * 60 * 24));
if (daysSinceContact < 1) score += 30;
else if (daysSinceContact < 3) score += 20;
else if (daysSinceContact < 7) score += 10;

// Número de interacciones (+25 puntos)
const messageCount = lead.message_count || 0;
if (messageCount > 10) score += 25;
else if (messageCount > 5) score += 15;
else if (messageCount > 2) score += 5;

// Productos consultados (+20 puntos)
const productsViewed = lead.products_viewed || 0;
if (productsViewed > 5) score += 20;
else if (productsViewed > 2) score += 10;
else if (productsViewed > 0) score += 5;

// Sentimiento positivo (+15 puntos)
if (lead.sentiment === 'positive') score += 15;
else if (lead.sentiment === 'neutral') score += 5;

// Intención de compra (+10 puntos)
if (lead.intent === 'purchase') score += 10;
else if (lead.intent === 'inquiry') score += 5;

return {
  json: {
    ...lead,
    score: Math.min(score, 100), // Cap at 100
    score_updated_at: new Date().toISOString()
  }
};
```

**Tiempo estimado:** 2-3 horas

---

#### Paso 6: Crear Workflow de Análisis de Sentimiento

**Workflow: "Conversation Analytics"**

```
┌─────────────────┐
│ Webhook Trigger │ → Al finalizar conversación
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Supabase Query  │ → Obtener todos los mensajes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ OpenAI Analysis │ → Analizar:
│                 │   • Sentimiento general
│                 │   • Temas mencionados
│                 │   • Productos de interés
│                 │   • Intent del cliente
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Function Node   │ → Procesar respuesta de IA
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save Analytics  │ → Guardar en Supabase
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   IF Node       │ → ¿Sentimiento negativo?
└────┬───────┬────┘
     │       │
   YES       NO
     │       │
     ▼       ▼
┌─────────┐ ┌──────────┐
│ Alert   │ │ Log      │
│ Manager │ │ Success  │
└─────────┘ └──────────┘
```

**Prompt para OpenAI:**

```
Analiza la siguiente conversación entre un agente de ventas y un cliente.
Proporciona un JSON con el siguiente formato:

{
  "sentiment": "positive" | "neutral" | "negative",
  "topics": ["precio", "envío", "garantía"],
  "products_mentioned": ["product-id-1", "product-id-2"],
  "intent": "purchase" | "inquiry" | "support" | "complaint",
  "resolution": "resolved" | "escalated" | "pending",
  "key_insights": "Resumen breve de la conversación"
}

Conversación:
{{$node["Get Messages"].json["messages"]}}
```

**Tiempo estimado:** 2 horas

---

### **FASE 3: Integración con E-Vendify (Semana 2)**

#### Paso 7: Crear Endpoints en Next.js

Crear API routes para comunicarse con n8n:

**`app/api/webhooks/n8n/conversation/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { storeId, action, data } = body

    // Validar webhook signature (seguridad)
    const signature = req.headers.get('x-n8n-signature')
    if (!isValidSignature(signature, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const supabase = createClient()

    switch (action) {
      case 'conversation.started':
        // Crear nueva conversación
        const { data: conversation, error } = await supabase
          .from('agent_conversations')
          .insert({
            store_id: storeId,
            customer_phone: data.phone,
            customer_name: data.name,
            channel: data.channel,
            status: 'active'
          })
          .select()
          .single()

        if (error) throw error
        return NextResponse.json({ conversation })

      case 'message.received':
        // Guardar mensaje
        await supabase.from('agent_messages').insert({
          conversation_id: data.conversationId,
          role: 'user',
          content: data.message,
          metadata: data.metadata
        })

        return NextResponse.json({ success: true })

      case 'message.sent':
        // Guardar respuesta del agente
        await supabase.from('agent_messages').insert({
          conversation_id: data.conversationId,
          role: 'assistant',
          content: data.message,
          metadata: data.metadata
        })

        return NextResponse.json({ success: true })

      case 'conversation.ended':
        // Marcar conversación como cerrada
        await supabase
          .from('agent_conversations')
          .update({ status: 'closed', updated_at: new Date().toISOString() })
          .eq('id', data.conversationId)

        // Trigger analytics workflow
        await triggerN8nWorkflow('conversation-analytics', {
          conversationId: data.conversationId
        })

        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function isValidSignature(signature: string | null, body: any): boolean {
  if (!signature) return false

  // Implementar validación HMAC
  const secret = process.env.N8N_WEBHOOK_SECRET
  const hmac = crypto.createHmac('sha256', secret!)
  hmac.update(JSON.stringify(body))
  const expectedSignature = hmac.digest('hex')

  return signature === expectedSignature
}

async function triggerN8nWorkflow(workflowName: string, data: any) {
  const response = await fetch(`${process.env.N8N_URL}/webhook/${workflowName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.N8N_API_KEY}`
    },
    body: JSON.stringify(data)
  })

  return response.json()
}
```

**Variables de entorno (`.env.local`):**

```bash
N8N_URL=http://localhost:5678
N8N_API_KEY=tu_api_key_de_n8n
N8N_WEBHOOK_SECRET=tu_secret_seguro
```

**Tiempo estimado:** 2 horas

---

#### Paso 8: Crear UI de Conversaciones

**`components/agent/ConversationList.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Phone, Mail } from 'lucide-react'

interface Conversation {
  id: string
  customer_name: string
  customer_phone: string
  channel: string
  status: string
  created_at: string
  message_count: number
}

export function ConversationList({ storeId }: { storeId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations()
  }, [storeId])

  async function loadConversations() {
    const { data, error } = await supabase
      .from('agent_conversations')
      .select(`
        *,
        message_count:agent_messages(count)
      `)
      .eq('store_id', storeId)
      .order('updated_at', { ascending: false })
      .limit(20)

    if (!error && data) {
      setConversations(data)
    }
    setLoading(false)
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return <Phone className="h-4 w-4" />
      case 'email': return <Mail className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversaciones Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                {getChannelIcon(conv.channel)}
                <div>
                  <p className="font-medium">{conv.customer_name}</p>
                  <p className="text-sm text-gray-500">{conv.customer_phone}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={conv.status === 'active' ? 'default' : 'secondary'}>
                  {conv.status}
                </Badge>
                <p className="text-sm text-gray-500 mt-1">
                  {conv.message_count} mensajes
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Agregar al dashboard:**

```typescript
// app/dashboard/page.tsx
import { ConversationList } from '@/components/agent/ConversationList'

// En el render:
<ConversationList storeId={businessProfile.id} />
```

**Tiempo estimado:** 3 horas

---

### **FASE 4: Features Avanzadas (Semana 3)**

#### Paso 9: Implementar Chat Widget

**`components/agent/ChatWidget.tsx`**

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageCircle, X, Send } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export function ChatWidget({ storeId }: { storeId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function sendMessage() {
    if (!input.trim()) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages([...messages, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Enviar a n8n webhook
      const response = await fetch(`${process.env.NEXT_PUBLIC_N8N_URL}/webhook/chat/${storeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages
        })
      })

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 z-50"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-white border rounded-lg shadow-xl z-50 flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg">
            <h3 className="font-semibold">Asistente de Ventas</h3>
            <p className="text-sm text-blue-100">Estamos aquí para ayudarte</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Escribiendo...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Escribe tu mensaje..."
                disabled={loading}
              />
              <Button onClick={sendMessage} disabled={loading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

**Agregar a la página de tienda:**

```typescript
// app/store/[storeId]/page.tsx
import { ChatWidget } from '@/components/agent/ChatWidget'

// En el render:
<ChatWidget storeId={storeId} />
```

**Tiempo estimado:** 4 horas

---

#### Paso 10: Dashboard de Analytics

**`app/dashboard/analytics/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, TrendingUp, Users, Clock } from 'lucide-react'

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalConversations: 0,
    activeConversations: 0,
    averageResponseTime: 0,
    sentimentBreakdown: {
      positive: 0,
      neutral: 0,
      negative: 0
    }
  })

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    // Query Supabase para estadísticas
    const { data: conversations } = await supabase
      .from('agent_conversations')
      .select('*')

    const { data: analytics } = await supabase
      .from('conversation_analytics')
      .select('*')

    // Calcular stats
    const totalConversations = conversations?.length || 0
    const activeConversations = conversations?.filter(c => c.status === 'active').length || 0

    const sentimentCounts = analytics?.reduce((acc, item) => {
      acc[item.sentiment] = (acc[item.sentiment] || 0) + 1
      return acc
    }, { positive: 0, neutral: 0, negative: 0 })

    setStats({
      totalConversations,
      activeConversations,
      averageResponseTime: 45, // Calcular real
      sentimentBreakdown: sentimentCounts || { positive: 0, neutral: 0, negative: 0 }
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics de Agentes</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Conversaciones</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeConversations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Respuesta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageResponseTime}s</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sentimiento Positivo</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.sentimentBreakdown.positive / stats.totalConversations) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Más gráficos aquí */}
    </div>
  )
}
```

**Tiempo estimado:** 3 horas

---

### **FASE 5: Testing y Optimización (Semana 4)**

#### Paso 11: Testing Completo

**Checklist de Testing:**

- [ ] **Flujo de WhatsApp**
  - [ ] Mensaje recibido correctamente
  - [ ] IA genera respuesta apropiada
  - [ ] Consulta productos en DB
  - [ ] Respuesta enviada exitosamente
  - [ ] Conversación guardada en DB

- [ ] **Lead Scoring**
  - [ ] Score se calcula correctamente
  - [ ] Leads hot (>70) notifican al equipo
  - [ ] Follow-ups programados automáticamente

- [ ] **Analytics**
  - [ ] Sentimiento detectado correctamente
  - [ ] Temas extraídos con precisión
  - [ ] Dashboard muestra datos en tiempo real

- [ ] **Performance**
  - [ ] Tiempo de respuesta < 3 segundos
  - [ ] Manejo de 100+ conversaciones simultáneas
  - [ ] Sin memory leaks en workflows largos

- [ ] **Seguridad**
  - [ ] Webhooks firmados correctamente
  - [ ] RLS en Supabase funcionando
  - [ ] API keys seguras

**Herramientas:**
```bash
# Load testing
npm install -g artillery

# artillery.yml
config:
  target: 'http://localhost:5678'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - flow:
      - post:
          url: "/webhook/whatsapp/test"
          json:
            from: "+1234567890"
            message: "Hola, quiero ver productos"
```

**Tiempo estimado:** 1-2 días

---

#### Paso 12: Deployment a Producción

**Checklist de Deployment:**

1. **n8n Production Setup**
```bash
# docker-compose.prod.yml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://n8n.tu-dominio.com
      - EXECUTIONS_PROCESS=main
      - EXECUTIONS_MODE=queue
      - QUEUE_BULL_REDIS_HOST=redis
      - QUEUE_BULL_REDIS_PORT=6379
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - n8n-network

  redis:
    image: redis:7-alpine
    restart: always
    networks:
      - n8n-network
    volumes:
      - redis_data:/data

volumes:
  n8n_data:
  redis_data:

networks:
  n8n-network:
```

2. **Nginx Reverse Proxy**
```nginx
# /etc/nginx/sites-available/n8n
server {
    listen 80;
    server_name n8n.tu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name n8n.tu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/n8n.tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.tu-dominio.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Backup Automation**
```bash
# backup-n8n.sh
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/n8n"

# Backup workflows
docker exec n8n n8n export:workflow --all --output=/home/node/.n8n/workflows_${DATE}.json

# Backup credentials (encriptadas)
docker exec n8n n8n export:credentials --all --output=/home/node/.n8n/credentials_${DATE}.json

# Copy to backup dir
docker cp n8n:/home/node/.n8n/workflows_${DATE}.json ${BACKUP_DIR}/
docker cp n8n:/home/node/.n8n/credentials_${DATE}.json ${BACKUP_DIR}/

# Upload to S3 (opcional)
aws s3 cp ${BACKUP_DIR}/workflows_${DATE}.json s3://tu-bucket/n8n-backups/
aws s3 cp ${BACKUP_DIR}/credentials_${DATE}.json s3://tu-bucket/n8n-backups/

# Delete old backups (mantener últimos 30 días)
find ${BACKUP_DIR} -name "*.json" -mtime +30 -delete
```

**Cron job:**
```bash
# crontab -e
0 2 * * * /path/to/backup-n8n.sh
```

4. **Monitoring**
```bash
# Instalar Uptime Kuma para monitoreo
docker run -d --name uptime-kuma \
  -p 3001:3001 \
  -v uptime-kuma:/app/data \
  louislam/uptime-kuma:1
```

**Tiempo estimado:** 1 día

---

## 📊 Métricas de Éxito

### KPIs a Medir

| Métrica | Objetivo | Herramienta |
|---------|----------|-------------|
| Tiempo de respuesta | < 3 segundos | n8n logs |
| Tasa de resolución | > 70% | Conversation analytics |
| Satisfacción del cliente | > 4.5/5 | Post-chat survey |
| Conversión de leads | > 15% | Lead tracking |
| Costo por conversación | < $0.10 | OpenAI usage + infraestructura |

### Dashboard de Monitoreo

```sql
-- Query para dashboard
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_conversations,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as completed,
  AVG(CASE WHEN analytics.sentiment = 'positive' THEN 1 ELSE 0 END) as positive_rate,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_duration_seconds
FROM agent_conversations
LEFT JOIN conversation_analytics ON agent_conversations.id = conversation_analytics.conversation_id
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 💰 Costos Estimados

### Infraestructura

| Componente | Costo Mensual | Notas |
|------------|---------------|-------|
| n8n (self-hosted) | $20 | VPS 2GB RAM, 2 vCPU |
| Supabase (Free tier) | $0 | Hasta 500MB DB, 2GB bandwidth |
| OpenAI API | $50-200 | Depende del volumen (GPT-4) |
| WhatsApp Business API | $0-100 | Varía por proveedor |
| **Total** | **$70-320/mes** | Para 1,000-5,000 conversaciones/mes |

### ROI Esperado

**Ejemplo:**
- Conversaciones/mes: 2,000
- Tasa de conversión: 15%
- Ventas generadas: 300
- Ticket promedio: $50
- Ingresos: $15,000/mes
- Costo de agentes: $150/mes
- **ROI: 10,000%**

---

## 🚀 Roadmap Futuro

### Corto Plazo (3 meses)

- [ ] Integración con más canales (Instagram, Facebook Messenger)
- [ ] Voice AI (llamadas telefónicas automatizadas)
- [ ] Multilenguaje automático
- [ ] A/B testing de prompts

### Medio Plazo (6 meses)

- [ ] Fine-tuning de modelos de IA propios
- [ ] Integración con CRM (HubSpot, Salesforce)
- [ ] Predicción de churn
- [ ] Recomendaciones de productos con ML

### Largo Plazo (12 meses)

- [ ] Agentes especializados por industria
- [ ] Marketplace de workflows
- [ ] API pública para integraciones
- [ ] Mobile app para gestión de agentes

---

## 📚 Recursos Adicionales

### Documentación
- [n8n Official Docs](https://docs.n8n.io/)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

### Comunidad
- [n8n Community Forum](https://community.n8n.io/)
- [Discord de n8n](https://discord.gg/n8n)
- [GitHub Examples](https://github.com/n8n-io/n8n/tree/master/packages/nodes-base/nodes)

### Templates
- [n8n Workflow Templates](https://n8n.io/workflows/)
- [AI Agent Templates](https://n8n.io/workflows/tag/ai/)

---

## ✅ Checklist Final

### Antes de Lanzar

- [ ] n8n instalado y configurado
- [ ] Tablas creadas en Supabase
- [ ] Workflows creados y testeados
- [ ] API endpoints funcionando
- [ ] UI de conversaciones implementada
- [ ] Chat widget integrado
- [ ] Analytics dashboard funcionando
- [ ] Testing completo pasado
- [ ] Documentación de operaciones lista
- [ ] Monitoreo configurado
- [ ] Backups automáticos activos
- [ ] Equipo entrenado en uso de herramientas

### Post-Lanzamiento

- [ ] Monitorear logs primeras 24 horas
- [ ] Recolectar feedback de usuarios
- [ ] Ajustar prompts de IA según necesidad
- [ ] Optimizar performance
- [ ] Iterar en workflows basado en datos

---

## 🎯 Conclusión

Esta estrategia te permitirá implementar agentes de ventas automatizados de manera incremental, empezando con funcionalidad básica y escalando según necesidades.

**Tiempo total estimado**: 3-4 semanas
**Costo inicial**: ~$100-300/mes
**ROI esperado**: 100x+ en 6 meses

**Próximo paso**: Comenzar con el Paso 1 (Instalar n8n) y seguir la guía paso a paso.

---

**Creado**: Diciembre 2025
**Versión**: 1.0
**Mantenido por**: E-Vendify Team
