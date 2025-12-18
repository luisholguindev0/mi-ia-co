import { pgTable, uuid, text, jsonb, timestamp, integer, vector, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// 1. LEADS
export const leads = pgTable('leads', {
    id: uuid('id').defaultRandom().primaryKey(),
    phoneNumber: text('phone_number').notNull().unique(),
    profile: jsonb('profile').default({ name: null, company: null, role: null, pain_points: [] }),
    status: text('status', { enum: ['new', 'diagnosing', 'qualified', 'booked', 'nurture', 'closed_lost'] }).default('new'),
    leadScore: integer('lead_score').default(0),
    contextEmbedding: vector('context_embedding', { dimensions: 1536 }),
    lastActive: timestamp('last_active', { withTimezone: true }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    aiPaused: boolean('ai_paused').default(false),
});

// 2. KNOWLEDGE_BASE
export const knowledgeBase = pgTable('knowledge_base', {
    id: uuid('id').defaultRandom().primaryKey(),
    content: text('content').notNull(),
    metadata: jsonb('metadata').default({}),
    category: text('category'),
    embedding: vector('embedding', { dimensions: 1536 }),
});

// 3. APPOINTMENTS
export const appointments = pgTable('appointments', {
    id: uuid('id').defaultRandom().primaryKey(),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    status: text('status', { enum: ['unconfirmed', 'confirmed', 'cancelled', 'completed'] }).default('unconfirmed'),
    googleCalendarId: text('google_calendar_id'),
    notes: text('notes'),
    reminderSent: boolean('reminder_sent').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 4. AUDIT_LOGS
export const auditLogs = pgTable('audit_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    leadId: uuid('lead_id').references(() => leads.id),
    eventType: text('event_type'),
    modelUsed: text('model_used'),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    payload: jsonb('payload'),
    latencyMs: integer('latency_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 5. MESSAGES
export const messages = pgTable('messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['user', 'assistant', 'system', 'human_agent'] }).notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
