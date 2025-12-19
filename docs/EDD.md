# MI IA COLOMBIA - Engineering Design Document

**Version**: 6.1.0 (Production Ready - December 19, 2025)  
**Status**: ✅ **VERIFIED WORKING** - E2E test passed, appointments confirmed

---

## 1. What This App Does

**Mi IA Colombia** is an autonomous WhatsApp sales assistant that:
1. Receives WhatsApp messages via webhook
2. Uses DeepSeek AI to have natural conversations in Colombian Spanish
3. Books appointments automatically when customers request demos
4. Provides an admin dashboard to monitor and manage leads

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

## 3. Architecture

```
WhatsApp → Webhook → Inngest Queue → AI Agent → Tool Execution → WhatsApp
                                         ↓
                                    Supabase DB
```

### Flow:
1. **Webhook receives message** (`/api/webhook/whatsapp`)
2. **Queued via Inngest** (async, prevents timeouts)
3. **AI generates response** (DeepSeek via `generateObject`)
4. **Tools executed** (booking, profile update)
5. **Response sent to WhatsApp**

---

## 4. Database Tables

| Table | Purpose |
|-------|---------|
| `leads` | Customer info, status, profile |
| `messages` | Conversation history |
| `appointments` | Booked demos (status: `confirmed`) |
| `business_settings` | Business hours, slot duration |
| `audit_logs` | AI decision logging |

---

## 5. Key Files

| File | Purpose |
|------|---------|
| `app/api/webhook/whatsapp/route.ts` | WhatsApp entry point |
| `inngest/functions.ts` | Async message processing |
| `lib/ai/agents.ts` | Single unified AI agent |
| `lib/ai/prompts.ts` | Simple, direct prompts (5 rules max) |
| `lib/ai/executor.ts` | Tool execution (booking, profile) |
| `lib/booking.ts` | Slot availability & booking |
| `lib/settings.ts` | Business hours from database |
| `lib/utils/date-utils.ts` | Spanish date parsing |

---

## 6. AI Tools

| Tool | Purpose |
|------|---------|
| `updateLeadProfile` | Save user info (name, company) |
| `checkAvailability` | Check slots for a date |
| `bookSlot` | Book an appointment (status: `confirmed`) |

Spanish dates are auto-converted:
- "mañana" → tomorrow's date
- "lunes" → next Monday
- "10am" → "10:00"

---

## 7. Admin Dashboard

| Route | Purpose |
|-------|---------|
| `/admin/dashboard` | Live lead feed, stats |
| `/admin/calendar` | Appointment management |
| `/admin/analytics` | Conversion metrics |
| `/admin/settings` | Business hours config |

Protected by Supabase auth + `app_metadata.role === 'admin'`.

---

## 8. Testing

```bash
# Initialize business settings (run once)
npx tsx scripts/init-business-settings.ts

# Run booking test (1 persona)
npx tsx scripts/test-booking.ts

# Check database results
npx tsx scripts/check-test-data.ts
```

---

## 9. Deployment

Auto-deploys on git push:
```bash
git push origin main
```

### Environment Variables
- `DEEPSEEK_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_APP_SECRET`
- `INNGEST_SIGNING_KEY`
- `INNGEST_EVENT_KEY`

---

## 10. Critical Fixes Applied (Dec 19, 2025)

### Fix 1: Appointment Cancellation
- **Problem**: Appointments created as `unconfirmed`, Sheriff cron cancelled them
- **Fix**: Changed `lib/booking.ts` to create with `status: 'confirmed'`

### Fix 2: AI Simplification
- **Problem**: Complex multi-agent system with 17+ rules caused loops
- **Fix**: Single unified agent with 5 simple rules

### Fix 3: Date Parsing
- **Problem**: AI passed "mañana" to booking, caused failures
- **Fix**: `lib/utils/date-utils.ts` converts Spanish to YYYY-MM-DD

---

## 11. Verified E2E Test Result

```
✅ ÉXITO: CITA AGENDADA Y CONFIRMADA
📅 Fecha: 2025-12-22T15:00:00+00:00 (Monday Dec 22, 10:00 AM)
📌 Estado: confirmed
```

---

*Last Updated: December 19, 2025 @ 12:35 PM Colombia*