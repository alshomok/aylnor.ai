# 🚀 Aylnor.ai - Vercel Deployment & Environment Variables Setup Guide

## ⚡ Quick Start (5 minutes)

### Step 1: Get Your API Keys

#### 🔴 Google Gemini API Keys
1. Visit: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key and save as `GEMINI_API_KEY_1`
4. Repeat for `GEMINI_API_KEY_2` (create 2 keys for failover)

#### 🔵 X.AI Grok API Keys
1. Visit: https://console.x.ai/
2. Create a new project
3. Generate API keys
4. Save as `GROK_API_KEY_1` and `GROK_API_KEY_2` (2 keys recommended)

#### 🟢 Supabase Configuration (Optional - for database)
1. Visit: https://app.supabase.com/
2. Create new project or use existing
3. Go to Settings → API
4. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 📋 All Required Environment Variables

```env
# Google Gemini API Keys (REQUIRED)
GEMINI_API_KEY_1=sk-xxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY_2=sk-xxxxxxxxxxxxxxxxxxxxx

# X.AI Grok API Keys (REQUIRED)
GROK_API_KEY_1=xai-xxxxxxxxxxxxxxxxxxxxx
GROK_API_KEY_2=xai-xxxxxxxxxxxxxxxxxxxxx

# Supabase Configuration (OPTIONAL - for database features)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NextAuth Configuration (OPTIONAL)
NEXTAUTH_URL=https://aylnor-ai.vercel.app
NEXTAUTH_SECRET=your_generated_secret_here

# Application URL
NEXT_PUBLIC_APP_URL=https://aylnor-ai.vercel.app
```

---

## 🔧 Setup Instructions

### For Local Development

1. **Create `.env.local` file** in project root:
```bash
cp .env.example .env.local
```

2. **Fill in your API keys** in `.env.local`

3. **Install dependencies**:
```bash
npm install
# or
yarn install
```

4. **Run development server**:
```bash
npm run dev
```

5. **Test your setup**:
```bash
# Send a test request to check if all keys are configured
curl -X POST http://localhost:3000/api/chat/enhanced \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test_keys"}]}'
```

Expected response:
```json
{
  "status": "Environment Check",
  "gemini_key_1": "✅ Set",
  "gemini_key_2": "✅ Set",
  "grok_key_1": "✅ Set",
  "grok_key_2": "✅ Set",
  "supabase_url": "✅ Set",
  "supabase_anon": "✅ Set"
}
```

---

### For Vercel Deployment

#### 1️⃣ Connect Your Repository to Vercel

1. Visit: https://vercel.com/new
2. Import your GitHub repository
3. Select your GitHub account and repository
4. Click "Import"

#### 2️⃣ Add Environment Variables in Vercel Dashboard

1. In Vercel dashboard, go to your project
2. Click **Settings** → **Environment Variables**
3. Add each variable from the list above:

```
GEMINI_API_KEY_1 = sk-xxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY_2 = sk-xxxxxxxxxxxxxxxxxxxxx
GROK_API_KEY_1 = xai-xxxxxxxxxxxxxxxxxxxxx
GROK_API_KEY_2 = xai-xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXTAUTH_URL = https://aylnor-ai.vercel.app
NEXTAUTH_SECRET = your_generated_secret
NEXT_PUBLIC_APP_URL = https://aylnor-ai.vercel.app
```

#### 3️⃣ Deploy

1. After adding environment variables, click **Deploy**
2. Wait for deployment to complete
3. Click **Visit** to see your live application

#### 4️⃣ Verify Deployment

Test your deployed API:
```bash
curl -X GET https://your-vercel-deployment.vercel.app/api/chat/enhanced
```

You should see:
```json
{
  "status": "operational",
  "environment": {
    "keys_configured": "All keys configured",
    "supabase_client": "Connected",
    "timestamp": "2026-05-14T..."
  },
  "available_models": {
    "gemini": "available",
    "grok": "available"
  }
}
```

---

## 🔍 Troubleshooting

### Issue: "Missing API keys" Error

**Solution:**
1. Verify all keys are added to Vercel Environment Variables
2. Check for typos in variable names (case-sensitive!)
3. Redeploy after adding variables:
   - Push a new commit: `git commit --allow-empty -m "Trigger redeploy"`
   - Or click **Redeploy** in Vercel dashboard

### Issue: "Supabase client not initialized"

**Solution:**
- This is normal if Supabase variables aren't set
- Chat will work without database
- Optional database features will be skipped
- To enable: Add Supabase variables to `.env.local` or Vercel

### Issue: Timeout Errors

**Solution:**
- Already increased timeout to 60 seconds in `vercel.json`
- If still timing out, check:
  - API key validity
  - Internet connection
  - API provider status

### Issue: CORS Errors

**Solution:**
- CORS is configured for production domain only
- For local testing, use different endpoint
- Vercel CORS only allows: `https://aylnor-ai.vercel.app`
- Update domain in `vercel.json` if using custom domain

---

## 📚 API Endpoints

### Basic Chat (No Database)
```
POST /api/chat
```

### Enhanced Chat (With Database)
```
POST /api/chat/enhanced
```

### Check Status
```
GET /api/chat/enhanced
```

---

## ✅ Checklist Before Production

- [ ] All API keys generated and added to Vercel
- [ ] Deployment successful on Vercel
- [ ] Test endpoint responds correctly
- [ ] Chat works in frontend
- [ ] Database (if using Supabase) is connected
- [ ] Custom domain configured (if applicable)
- [ ] Monitor API usage to avoid quota limits

---

## 🛡️ Security Best Practices

1. **Never commit `.env.local` to Git**
   - Add to `.gitignore` (already done)

2. **Use different keys for Prod/Dev**
   - Recommended: 2-4 API keys per service

3. **Rotate keys regularly**
   - Check monthly usage
   - Regenerate if compromised

4. **Monitor API quotas**
   - Google: https://console.cloud.google.com/
   - X.AI: https://console.x.ai/
   - Supabase: https://app.supabase.com/

5. **Restrict CORS origins**
   - Already configured in `vercel.json`
   - Update domain list as needed

---

## 📞 Support

If you encounter issues:

1. Check logs: Vercel Dashboard → Deployments → Logs
2. Test locally: `npm run dev`
3. Verify API keys are valid
4. Check API provider status pages
5. Review error messages for specific guidance

---

## 🎉 You're All Set!

Your Aylnor.ai chatbot is now ready to serve AI responses with automatic failover between Gemini and Grok models!

**Key Features Active:**
- ✅ Multi-model failover
- ✅ Error handling
- ✅ Database integration (if Supabase configured)
- ✅ Production ready
- ✅ Scalable on Vercel
