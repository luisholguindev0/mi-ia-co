# Deployment Guide: MI IA COLOMBIA ASOS

This guide covers how to get your production keys and deploy the system to Vercel.

## 1. Get Inngest Production Keys (The Event Bus)

Inngest is what keeps your bot from crashing when 50 people message at once.

1.  Go to [app.inngest.com](https://app.inngest.com) and Sign Up (GitHub login recommended).
2.  Create a new App (Name: `mi-ia-colombia`).
3.  On the dashboard, look for **"Event Key"** (It usually starts with `ink_...`).
4.  Copy the **Event Key**.
5.  Copy the **Signing Key** (Found in Settings > Signing Key).

**Save these for Step 3.**

## 2. Get WhatsApp Production Tokens (The Connectivity)

To send real messages, you need the Meta tokens.

1.  Go to [developers.facebook.com](https://developers.facebook.com).
2.  Select your App -> WhatsApp > API Setup.
3.  Copy the **Phone Number ID**.
4.  Copy the **Temporary Access Token** (For testing) OR initiate the System User flow for a permanent token (Recommended for Production).
    *   *Tip: For now, the temporary token works for 24h.*

**Save these for Step 3.**

## 3. Deploy to Vercel (The Server)

1.  Go to your terminal in this project.
2.  Run: `npx vercel deploy` (or just `vercel`).
    *   It will ask you to log in and set up the project. Accept defaults (Y).
3.  Once deployed, go to the **Vercel Dashboard** for this project.
4.  Go to **Settings** > **Environment Variables**.
5.  Add the following keys (Copy from your `.env.local` + the new Inngest ones):

| Key | Value Source |
|-----|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` |
| `DEEPSEEK_API_KEY` | `.env.local` |
| `OPENAI_API_KEY` | `.env.local` |
| `INNGEST_EVENT_KEY` | **From Step 1** |
| `INNGEST_SIGNING_KEY` | **From Step 1** |
| `WHATSAPP_PHONE_NUMBER_ID` | **From Step 2** |
| `WHATSAPP_ACCESS_TOKEN` | **From Step 2** |
| `WHATSAPP_VERIFY_TOKEN` | Your chosen secret pass (e.g., `mi_secreto_seguro`) |

6.  **Redeploy** (Go to Deployments > Redeploy) to apply the keys.

## 4. Connect WhatsApp Webhook

1.  Copy your Vercel Domain (e.g., `https://mi-ia-asos.vercel.app`).
2.  Go back to **Meta Developers** > WhatsApp > Configuration.
3.  Click **Edit** on Webhook.
4.  **Callback URL**: `https://YOUR-VERCEL-DOMAIN.vercel.app/api/webhook/whatsapp`
5.  **Verify Token**: `mi_secreto_seguro` (Must match what you put in Vercel).
6.  Click **Verify and Save**.

## 5. Connect Inngest to Vercel

1.  Go back to **Inngest Dashboard**.
2.  It should automatically detect your Vercel deployment if you used the Vercel Integration, OR...
3.  Just trigger a test message. Inngest automatically syncs with Next.js when the `api/inngest` route is hit.

---
**Done! Your bot is live.**
