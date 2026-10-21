# GHA Asset Manager — Supabase Edge Backend Guide

This project is now configured to host the backend directly on **Supabase** via **Supabase Edge Functions**, completely eliminating Render and traditional server hosting.

---

## 🏗️ Architecture

```
Netlify (React Frontend)
       │
       ▼ (HTTPS REST / JSON)
Supabase Edge Function (`/functions/v1/api`)
       │
       ▼ (Direct Internal Connection)
Supabase PostgreSQL Database (Tables: assets, users, maintenance_tasks, asset_history, notifications)
```

- **0 Cold Starts:** Edge functions execute on Supabase's globally distributed Deno runtime.
- **100% Serverless:** No Docker containers, no VM management, no sleeping servers.
- **Free Tier Compatible:** Runs entirely within the free tiers of Netlify and Supabase.

---

## 🚀 Quick Deployment (Terminal)

### 1. Get your Supabase Project Reference
In the [Supabase Dashboard](https://supabase.com/dashboard):
- Look at your project URL: `https://[PROJECT-REF].supabase.co`
- Or go to **Project Settings → General → Reference ID** (e.g. `abcdefghijklmnopqrst`).

### 2. Login to Supabase CLI
```bash
npx supabase login
```
*(This opens your browser to generate a personal access token)*

### 3. Deploy the Edge Function
Run the following command (replace `[YOUR-PROJECT-REF]` with your actual project reference):
```bash
npx supabase functions deploy api --project-ref [YOUR-PROJECT-REF] --no-verify-jwt --use-api
```

Your API will be instantly deployed and live at:
```
https://[YOUR-PROJECT-REF].supabase.co/functions/v1/api
```

---

## 🌐 Connecting Netlify Frontend to Supabase Backend

1. Go to your [Netlify Dashboard](https://app.netlify.app) → Select your site.
2. Go to **Site Configuration → Environment variables**.
3. Set `VITE_API_URL` to your Supabase function endpoint:
   ```env
   VITE_API_URL=https://[YOUR-PROJECT-REF].supabase.co/functions/v1/api
   ```
4. Trigger a **Clear cache and deploy site** under the **Deploys** tab.

---

## 🔄 Optional: Automatic Deployment via GitHub Actions

Whenever you push to the `main` branch, GitHub can deploy your backend automatically:
1. In your GitHub repository, go to **Settings → Secrets and variables → Actions**.
2. Add the following secrets:
   - `SUPABASE_PROJECT_ID`: Your Supabase Project Reference ID.
   - `SUPABASE_ACCESS_TOKEN`: Generated from [Supabase Account Tokens](https://supabase.com/dashboard/account/tokens).
3. Any push affecting `supabase/**` will deploy automatically!

---

## 🧪 Testing the Supabase API

Once deployed, you can verify your function:

```bash
# Health check
curl https://[YOUR-PROJECT-REF].supabase.co/functions/v1/api/health

# Login test
curl -X POST https://[YOUR-PROJECT-REF].supabase.co/functions/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'
```
