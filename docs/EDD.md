# MI IA COLOMBIA - Engineering Design Document

**Version**: 6.0.0 (Production - December 2025)  
**Status**: ✅ **WORKING** - Verified E2E on Dec 19, 2025

---

## 1. What This App Actually Does

**Mi IA Colombia** is an autonomous WhatsApp sales assistant that:
1. Receives WhatsApp messages via webhook
2. Uses DeepSeek AI to have natural conversations in Colombian Spanish
3. Books appointments automatically when customers request demos
4. Provides an admin dashboard to monitor and manage leads

That's it. No overcomplicated "multi-agent cognitive architecture". Just a simple, working booking system.

---

## 2. Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Framework | Next.js 16 | Server components, API routes, Vercel deployment |
| Database | Supabase (PostgreSQL) | Simple, hosted, real-time subscriptions |
| AI Model | DeepSeek Chat | Cheap ($0.01/call), fast, good Spanish |
| Event Queue | Inngest | Async message processing, retry logic |
| AI SDK | Vercel AI SDK | `generateObject` for structured JSON output |
| Styling | Tailwind CSS | Standard |

---

## 3. Core Architecture (Simple Version)

```
WhatsApp → Webhook → Inngest Queue → AI Agent → Tool Execution → WhatsApp
                                         ↓
                                    Supabase DB
```

### Flow:
1. **Webhook receives message** (`/api/webhook/whatsapp`)
2. **Queued via Inngest** (async, prevents timeouts)
3. **AI generates response** (DeepSeek via `generateObject`)
4. **Tools executed** (if AI requests booking/profile update)
5. **Response sent to WhatsApp**

---

## 4. Database Schema (What Matters)

### `leads`
- `id`, `phone_number`, `status`, `profile` (jsonb)
- Status: `new` → `diagnosing` → `qualified` → `booked`

### `messages`
- `id`, `lead_id`, `role` (user/assistant), `content`, `created_at`

### `appointments`
- `id`, `lead_id`, `start_time`, `end_time`, `status`

### `business_settings`
- Key-value store for business hours, slot duration, etc.

### `audit_logs`
- Logs every AI decision for debugging

---

## 5. Key Files

| File | Purpose |
|------|---------|
| `app/api/webhook/whatsapp/route.ts` | WhatsApp webhook entry point |
| `inngest/functions.ts` | Async message processing |
| `lib/ai/agents.ts` | AI response generation |
| `lib/ai/prompts.ts` | System prompts (simple, direct) |
| `lib/ai/executor.ts` | Tool execution (booking, profile) |
| `lib/booking.ts` | Slot availability & booking logic |
| `lib/settings.ts` | Business hours from database |
| `lib/utils/date-utils.ts` | Spanish date parsing ("mañana" → "2025-12-20") |

---

## 6. AI System

### Prompts
The AI uses **simple, direct prompts** (see `lib/ai/prompts.ts`):
- Max 2 sentences per response
- No repeating what user said
- When user mentions a time → call booking tools

### Tools
The AI can call these tools (defined in `lib/ai/tools.ts`):
- `updateLeadProfile` - Save user info (name, company, pain points)
- `checkAvailability` - Check slots for a date
- `bookSlot` - Book an appointment

### Date Parsing
Spanish dates are automatically converted:
- "mañana" → tomorrow's date
- "miércoles" → next Wednesday
- "7am" → "07:00"

---

## 7. Admin Dashboard

- `/admin/dashboard` - Live lead feed, stats
- `/admin/calendar` - Appointment management
- `/admin/analytics` - Conversion metrics
- `/admin/settings` - Business hours config

Protected by Supabase auth + role check (`app_metadata.role === 'admin'`).

---

## 8. Testing

### E2E Test
```bash
npx tsx scripts/e2e-booking-test.ts
```

AI-to-AI conversation that verifies the full booking flow.

### Check Results
```bash
npx tsx scripts/check-test-data.ts
```

Shows lead status, audit logs, and appointments.

### Initialize Settings
```bash
npx tsx scripts/init-business-settings.ts
```

Populates `business_settings` table with default hours.

---

## 9. Deployment

Automatic via Vercel:
```bash
git push origin main
```

Environment variables needed:
- `DEEPSEEK_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_APP_SECRET`
- `INNGEST_SIGNING_KEY`
- `INNGEST_EVENT_KEY`

---

## 10. What Was Removed (December 19, 2025)

Deleted 8,433 lines of broken code:
- ❌ Complex "Doctor/Closer" multi-agent architecture
- ❌ Overcomplicated testing framework with 10 personas
- ❌ Auto-summarization that never worked
- ❌ RAG with pgvector (not needed for MVP)

**Philosophy**: Simple code that works > Complex code that doesn't.

---

## 11. Verification Results

**Date**: December 19, 2025

| Test | Result |
|------|--------|
| Webhook receives messages | ✅ |
| AI generates responses | ✅ |
| `checkAvailability` called | ✅ (returned 4 slots) |
| `bookSlot` called | ✅ (appointment created) |
| Lead status → `booked` | ✅ |
| Appointment in database | ✅ |

**Proof**: See `scripts/check-test-data.ts` output.

---

*Last Updated: December 19, 2025*