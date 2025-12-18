-- Enable Vector Extension for Semantic Search
create extension if not exists vector;

-- 1. LEADS (The Entity)
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  phone_number text unique not null,
  
  -- Perfilamiento progresivo
  profile jsonb default '{"name": null, "company": null, "role": null, "pain_points": []}'::jsonb,
  
  -- State Machine Control
  status text default 'new' check (status in ('new', 'diagnosing', 'qualified', 'booked', 'nurture', 'closed_lost')),
  lead_score int default 0,
  
  -- RAG Memory: Vector promedio de toda la conversación
  context_embedding vector(1536), 
  
  -- Meta
  last_active timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_leads_phone on leads(phone_number);

-- 2. KNOWLEDGE_BASE (The Brain)
create table if not exists knowledge_base (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  category text, 
  embedding vector(1536)
);

create index if not exists idx_knowledge_embedding on knowledge_base using hnsw (embedding vector_cosine_ops);

-- 3. APPOINTMENTS (Booking Engine)
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text default 'unconfirmed' check (status in ('unconfirmed', 'confirmed', 'cancelled', 'completed')),
  google_calendar_id text,
  notes text,
  
  -- Constraint para evitar doble agendamiento
  constraint no_overlap exclude using gist (
    tstzrange(start_time, end_time) with &&
  )
);

-- 4. AUDIT_LOGS (Observability & Debugging)
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id),
  event_type text, -- 'webhook_received', 'ai_thought', 'tool_execution', 'message_sent', 'guardrail_intervention'
  model_used text, -- 'deepseek-v3', 'deepseek-r1'
  input_tokens int,
  output_tokens int,
  payload jsonb, 
  latency_ms int,
  created_at timestamptz default now()
);
