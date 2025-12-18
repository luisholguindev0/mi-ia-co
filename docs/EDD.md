🏛️ MI IA COLOMBIA: ENGINEERING DESIGN DOCUMENT (EDD)

Versión: 5.0.0 (The Architect's Bible - Dec 2025)
Target: Antigravity + Gemini 3 Pro Agents (Agentic Orchestration)
Architecture: Event-Driven Serverless + Agentic RAG + Semantic Guardrails
Status: BLUEPRINT FOR PRODUCTION

1. EXECUTIVE SUMMARY & TECH STACK (2025 ENTERPRISE STANDARD)

No estamos construyendo un simple "chatbot" de respuestas pregrabadas. Estamos arquitectando un Sistema Operativo de Ventas Autónomo (ASOS). En el panorama actual de 2025, la ventaja competitiva no es tener IA, sino tener una IA que pueda razonar, planificar y ejecutar sin supervisión humana constante, manteniendo costos marginales cercanos a cero.

Nuestra arquitectura debe ser estrictamente "Stateless" (sin estado persistente en servidor) para permitir una escalabilidad horizontal infinita en el Edge, y "Event-Driven" (basada en eventos) para desacoplar la recepción de mensajes del procesamiento pesado de inferencia.

The Stack (Bleeding Edge & Rationale)

Core Framework: Next.js 16 (App Router, Turbopack).

Why: Necesitamos Server Actions para la lógica de mutación y Route Handlers para los webhooks. El despliegue en Vercel Edge elimina la latencia de "cold start" (Update: Migrated to `proxy.ts`, configured `turbopack.root`).

Database & Vector Engine: Supabase (PostgreSQL 16 + pgvector + pg_cron).

Why: No queremos gestionar bases de datos separadas para vectores (Pinecone) y relacionales. Postgres lo hace todo. pgvector permite búsquedas semánticas milimétricas para el RAG.

ORM: Drizzle ORM.

Why: A diferencia de Prisma, Drizzle es "Zero-dependency" en tiempo de ejecución y permite consultas SQL-like con seguridad de tipos (TypeScript) extrema. Es vital para mantener el bundle size pequeño en Edge Functions.

AI Orchestration: Vercel AI SDK Core (Protocolo generateObject).

Why: En 2025, no pedimos texto libre. Pedimos JSON estructurado. generateObject fuerza a los LLMs a devolver esquemas validados por Zod, eliminando el 99% de errores de parsing.

LLMs (Model Swarm Strategy):

Reasoning Engine: DeepSeek-R1 (via OpenRouter/Direct). Usado exclusivamente para tareas de diagnóstico complejo donde se requiere "Chain of Thought" (Cadena de Pensamiento).

Conversational Engine: DeepSeek-V3. Optimizado para latencia (<200ms) y empatía en chat.

Embedding Model: text-embedding-3-small (o nomic-embed-text self-hosted). Vital para convertir el "dolor del cliente" en vectores matemáticos.

Guardrails & Safety: Zod Schema Validation + Heuristic Post-Processing + Semantic Routing.

Why: La IA no puede prometer cosas ilegales. Usamos validación determinista antes de enviar cualquier byte a WhatsApp.

Event Bus: Inngest.

Why: El manejo de Webhooks de WhatsApp requiere durabilidad. Si DeepSeek se cae, Inngest reintenta el evento exponencialmente. No perdemos ni un lead.

2. ADVANCED AGENTIC ARCHITECTURE (RAG + TOOLS + MEMORY)

El sistema opera bajo el paradigma de "Cognitive Architecture". No es una función lineal input -> output. Es un ciclo de Percepción -> Recuperación -> Razonamiento -> Acción.

2.1. The "Doctor" Agent (RAG Pipeline Deep Dive)

El agente R1 actúa como un consultor experto. Para evitar alucinaciones, implementamos un pipeline RAG (Retrieval-Augmented Generation) estricto.

Semantic Ingestion (Percepción):

El usuario envía: "Tengo una ferretería y pierdo mucho tiempo con el inventario en cuadernos".

El sistema genera un vector embedding de este input: [0.12, -0.45, 0.88, ...].

Vector Retrieval (Recuperación):

Consultamos la tabla knowledge_base usando distancia coseno (<=>).

Query: Busca fragmentos de conocimiento donde la similitud semántica sea > 0.85 con el input.

Resultados: El sistema recupera estadísticas reales: "El sector retail ferretero pierde 15% anual por inventario fantasma" y "La rotación de inventario manual causa quiebres de stock del 30%".

Context Injection (Aumentación):

Inyectamos estos fragmentos en el "System Prompt" de forma invisible para el usuario.

Prompt Dinámico: "Usa el siguiente contexto recuperado para diagnosticar al usuario. NO inventes datos. Contexto: { ... }"

Reasoning Generation (Razonamiento):

DeepSeek-R1 procesa la información y genera un diagnóstico: "Luis, tu problema no es el cuaderno en sí. Es la ceguera operativa. Basado en empresas similares, estás perdiendo un 15% de margen por robo hormiga y desactualización. Necesitas digitalizar la entrada de stock."

2.2. The "Guardrails" Layer (Defense in Depth)

La seguridad no es una capa externa, es intrínseca. Cada mensaje saliente pasa por tres filtros:

PII Redaction (Privacidad): Un regex scanner busca patrones de tarjetas de crédito, cédulas o direcciones que no pertenezcan al usuario actual y bloquea la respuesta si la IA intenta filtrar datos de entrenamiento.

Sentiment & Tone Analysis: Analizamos la respuesta generada. Si el score de toxicidad es > 0.1, o si el tono es "pasivo-agresivo", se regenera la respuesta con una temperatura más baja.

Promise Firewall: Un filtro semántico busca frases de compromiso legal como "Garantizamos retorno", "Prometemos ganancias", "100% seguro". Si se detectan, se reescriben automáticamente a "Estimamos un potencial retorno", "Nuestro objetivo es", etc.

3. DATABASE SCHEMA (VECTOR ENABLED & OPTIMIZED)

Este esquema SQL es la columna vertebral. Incluye índices HNSW para búsqueda vectorial ultrarrápida y particionamiento para escalar.

-- Enable Vector Extension for Semantic Search
create extension if not exists vector;

-- 1. LEADS (The Entity)
-- Centraliza la información del prospecto y su estado en la máquina de ventas.
create table leads (
  id uuid primary key default gen_random_uuid(),
  phone_number text unique not null,
  
  -- Perfilamiento progresivo (se llena a medida que el chat avanza)
  profile jsonb default '{"name": null, "company": null, "role": null, "pain_points": []}'::jsonb,
  
  -- State Machine Control
  status text default 'new' check (status in ('new', 'diagnosing', 'qualified', 'booked', 'nurture', 'closed_lost')),
  lead_score int default 0, -- Calculado por R1 basado en calidad de respuestas
  
  -- RAG Memory: Vector promedio de toda la conversación para "Long-term Memory"
  context_embedding vector(1536), 
  
  -- Meta
  last_active timestamptz default now(),
  created_at timestamptz default now()
);

-- Index for fast lookups by phone (Critical for Webhook speed)
create index idx_leads_phone on leads(phone_number);

-- 2. KNOWLEDGE_BASE (The Brain)
-- Almacena fragmentos de sabiduría de negocio, casos de éxito y datos duros.
create table knowledge_base (
  id uuid primary key default gen_random_uuid(),
  content text not null, -- El fragmento de texto real
  metadata jsonb default '{}'::jsonb, -- { "source": "Informe McKinsey", "date": "2024" }
  category text, -- 'law', 'retail', 'health', 'pricing'
  embedding vector(1536) -- Vector generado por text-embedding-3-small
);

-- HNSW Index for ultra-fast vector similarity search (Approximate Nearest Neighbor)
create index idx_knowledge_embedding on knowledge_base using hnsw (embedding vector_cosine_ops);

-- 3. APPOINTMENTS (Booking Engine)
-- Sistema de reservas interno. Single Source of Truth.
create table appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text default 'unconfirmed' check (status in ('unconfirmed', 'confirmed', 'cancelled', 'completed')),
  google_calendar_id text, -- Para futura sincronización bidireccional
  notes text
);

-- Constraint para evitar doble agendamiento a nivel de base de datos
alter table appointments add constraint no_overlap exclude using gist (
  tstzrange(start_time, end_time) with &&
);

-- 4. AUDIT_LOGS (Observability & Debugging)
-- Cada "pensamiento" de la IA se registra aquí para auditoría forense.
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id),
  event_type text, -- 'webhook_received', 'ai_thought', 'tool_execution', 'message_sent', 'guardrail_intervention'
  model_used text, -- 'deepseek-v3', 'deepseek-r1'
  input_tokens int,
  output_tokens int,
  payload jsonb, -- Input completo + Output completo
  latency_ms int,
  created_at timestamptz default now()
);


4. THE MASTER PROMPT (FOR GEMINI 3 PRO / AGENT)

Este es el "Prompt de Arquitecto" que usarás en Project IDX. Copia esto tal cual para inicializar tu sesión de codificación con el agente.

INSTRUCTION FOR AI AGENT (GEMINI 3 PRO):

Role: You are a Principal Software Architect & Lead Engineer at a futuristic AI Lab. You specialize in Event-Driven Architectures, LLM Orchestration (Agentic Workflows), and Production-Grade Next.js systems built for extreme scalability and reliability.

Objective: Architect and Code "Mi IA Colombia", a high-performance, autonomous sales infrastructure using Next.js 16, Supabase, and DeepSeek APIs. The goal is to replace human SDRs with autonomous agents.

Core Engineering Philosophy:

Vibe Code & Clean Architecture: Write code that is minimalist, functional, and self-documenting. Use shadcn/ui for a premium aesthetic. Logic must be decoupled from UI.

Extreme Type Safety: All database interactions MUST be typed via Drizzle ORM. Inputs/Outputs of AI agents must be validated with Zod Schemas. NO any types allowed.

Radical Observability: The system is a black box unless we instrument it. Every AI decision, tool call, and latency metric must be logged to Supabase audit_logs asynchronously.

Graceful Degradation: If DeepSeek API fails or times out, the system must fallback to a deterministic rule-based response ("I'm checking my agenda...") rather than crashing or hanging.

Detailed Architecture Requirements:

Webhook Ingestion Layer (/api/webhook/whatsapp):

Must implement HMAC SHA-256 signature verification to prevent spoofing.

Must be Idempotent: Handle duplicate webhooks (retries from Meta) without triggering double AI responses. Use Redis or DB uniqueness checks.

Async Pattern: Save message to DB -> Push event to Inngest queue -> Respond 200 OK to Meta immediately (<500ms). Do NOT wait for AI generation to respond to the webhook.

The Brain (DeepSeek Wrapper & RAG):

Create lib/ai/agent.ts.

Implement generateObject from Vercel AI SDK to force strict JSON outputs.

RAG Logic: Before calling the LLM, embed the user query, query knowledge_base with cosine similarity, and append the top 3 chunks to the system prompt.

Tool Definitions: Define tools like checkAvailability, bookSlot, handoffToHuman.

Booking Engine Core (lib/booking/):

Implement strict logic to check appointments table for overlaps using Postgres ranges.

Do NOT rely on external APIs initially. The DB is the source of truth.

Function getAvailableSlots(date) must return time slots respecting business hours (Mon-Fri, 9-5) and existing bookings.

The "God Mode" Dashboard (/admin):

Use supabase.channel for Realtime WebSocket updates. The feed must feel "alive".

Implement a Kanban Board where card movements trigger DB updates.

Takeover Switch: A boolean toggle that immediately disables the AI processing for a specific lead_id and allows manual message injection.

Coding Style & Structure:

Use Functional React Components with Hooks.

Use Tailwind CSS for all styling (Mobile-first).

Use lucide-react for iconography.

Keep business logic inside /lib, keep UI inside /components, keep API routes inside /app/api.

Action: Start by scaffolding the directory structure, installing dependencies (drizzle-orm, ai, @ai-sdk/deepseek, zod, inngest), and setting up the Supabase client.

5. GUARDRAILS, SECURITY & COMPLIANCE

En el ecosistema de IA de 2025, la seguridad es la prioridad #1.

5.1. Prompt Injection Defense (The Firewall)

Los ataques de inyección de prompt intentan que el modelo ignore sus instrucciones.

Stratgey: "Instruction Sandwich".

Colocamos las instrucciones críticas al principio Y al final del prompt del sistema.

Usamos delimitadores XML <user_input> para aislar explícitamente el texto del usuario y que el modelo sepa que es datos, no instrucciones.

Semantic Validator: Un modelo pequeño (como un clasificador BERT o un GPT-4o-mini barato) analiza el input del usuario buscando patrones de jailbreak ("DAN mode", "Ignore previous instructions") antes de pasarlo al modelo principal.

5.2. Role-Based Access Control (RBAC)
- **Strategy**: Use Supabase `app_metadata` to store roles (e.g., `{"role": "admin"}`).
- **Enforcement**:
  - **Middleware**: Intercepts `/admin` routes and checks `user.app_metadata.role === 'admin'`.
  - **Server-Side APIs**: Sensitive endpoints (e.g., `/api/export/*`) perform explicit role checks before processing.
  - **Security Layer**: `app_metadata` is managed via Supabase Admin (SQL/Dashboard) and cannot be manipulated by the user from the frontend client.

5.3. Hallucination Control (Grounding)

Citation Enforcement: El modelo R1 está configurado para fallar si no puede encontrar una fuente en la knowledge_base.

Confidence Thresholds: Si la probabilidad (logprobs) de la respuesta generada es baja (< 70%), el sistema descarta la respuesta generada y envía una respuesta de "fallback": "Esa es una excelente pregunta técnica. Déjame consultarlo con Luis y te respondo en unos minutos." (Y alerta al dashboard).

6. ROADMAP TO DEPLOYMENT (THE 4-WEEK SPRINT)

Este plan de batalla asegura una ejecución disciplinada y sin deuda técnica.

WEEK 1: The Backbone & The Cortex (Infrastructure + AI) - **[COMPLETED]**

[x] Day 1: Inicializar repositorio Next.js 15. Configurar Supabase. Ejecutar migraciones SQL iniciales.

[x] Day 2: Configurar Drizzle ORM/Supabase Client. Poblar knowledge_base con estadísticas de industria.

[x] Day 3: Construir infraestructura de Webhook Whatsapp (HMAC) y Bus de Eventos (Inngest).

[x] Day 4: Construir DoctorAgent (R1) y CloserAgent (V3). Implementar RAG Pipeline y Booking Engine.

[x] Day 5: Pruebas de Integración (DeepSeek + Webhook + Inngest). Validar Latencia.

WEEK 2: The Cockpit (Admin UI & Realtime) - **[COMPLETED]**

[x] Day 1: Construir sistema de Auth (Login protegido para Luis).

[x] Day 2: Desarrollar componente RealtimeFeed suscrito a cambios de Postgres.

[x] Day 3: Implementar interfaz de "God Mode" (Chat Interceptor) con capacidad de respuesta manual.

[x] Day 4: Tablero Kanban con métricas en tiempo real (Leads calificados hoy, Citas agendadas).

[x] Day 5: Pulido de UI (Dark Mode, Animaciones Framer Motion, Feedback visual).

WEEK 3: Production Hardening & Reliability - **[COMPLETED]**

[x] Day 1: Implementar "The Sheriff" (Cron Jobs via Inngest) para confirmaciones automáticas y recordatorios.
[x] Day 2: Red Teaming. Stress test de la base de datos y RAG pipeline. Intentar romper el bot.
[x] Day 3: Pruebas de Carga. Simular concurrencia en webhooks.
[x] Day 4: Optimización de Consultas y Índices (Explain Analyze).
[x] Day 5: Preparación de Entorno de Producción (Variables, Secretos, Dominios).

STABILITY & SECURITY HARDENING (POST-WEEK 3) - **[COMPLETED]**
[x] Full Codebase Verification: Audited Sheriff, Guardrails, and RAG.
[x] Security Lockdown: Applied RBAC (Role-Based Access Control) to Middleware and Export APIs.
[x] Global Auth Protection: Hardened `middleware.ts` to enforce `admin` role checks.
[x] Webhook Reliability: Hardened WhatsApp gateway to "Fail-Closed" mode.

STABILITY & MAINTENANCE PHASE (LINTING & TYPES) - **[COMPLETED]**
[x] Resolve all `npm run lint` errors and warnings.
[x] Elimination of `any` types for strict production type safety.
[x] Verify zero-error production build.

WEEK 4: The Grand Opening (Launch & Scale) - **[CURRENT FOCUS]**

[ ] Day 1: Soft Launch. Invitar a 5-10 amigos empresarios a probar el flujo completo (End-to-End).

[ ] Day 2: Monitoring & Hotfixes. Monitor del Audit Log en tiempo real para corrección de bugs críticos.

[ ] Day 3: GO LIVE. Activar campañas de Meta Ads (Tráfico Real).

[ ] Day 4: Performance Review. Análisis de conversión y latencia con tráfico real.

[ ] Day 5: Handover & Celebration. Documentación final y entrega del sistema.

7. CRITICAL FILE STRUCTURE (FOR AGENT REFERENCE)

Una estructura de archivos limpia es vital para que el agente de IA entienda el contexto del proyecto.

/
├── app/
│   ├── api/
│   │   ├── cron/
│   │   │   └── sheriff/route.ts   # Cron job de confirmación
│   │   ├── inngest/               # Configuración de Inngest (Event Bus)
│   │   │   └── route.ts
│   │   └── webhook/
│   │       └── whatsapp/route.ts  # Punto de entrada principal
│   ├── admin/                     # Panel de Control protegido
│   │   ├── dashboard/page.tsx
│   │   └── leads/[id]/page.tsx
│   └── layout.tsx
├── components/
│   ├── admin/
│   │   ├── RealtimeFeed.tsx       # Componente WebSocket
│   │   ├── ChatInterceptor.tsx    # UI de Chat Manual vs IA
│   │   └── KanbanBoard.tsx
│   └── ui/                        # Componentes shadcn/ui reutilizables
├── lib/
│   ├── ai/
│   │   ├── agents.ts              # Definición de Agentes (Doctor/Closer)
│   │   ├── tools.ts               # Definición Zod de Tools
│   │   ├── rag.ts                 # Lógica de Embedding y Búsqueda
│   │   └── prompts.ts             # System Prompts centralizados
│   ├── db/
│   │   ├── schema.ts              # Esquema Drizzle
│   │   └── index.ts               # Cliente conexión DB
│   └── booking.ts                 # Lógica pura de calendario
├── inngest/
│   └── functions.ts               # Funciones de fondo (Procesar mensaje)
└── .env.local                     # Secretos (API Keys)


Firmado:
La C-Suite de Mi IA Colombia - Arquitectura 2025