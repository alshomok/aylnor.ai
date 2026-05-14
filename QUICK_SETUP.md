# ⚡ Quick Reference: Vercel Deployment Checklist

## 📋 30-Second Setup

### Step 1: Gather Your Keys (2 min)
```
GEMINI_API_KEY_1 = from https://aistudio.google.com/app/apikey
GEMINI_API_KEY_2 = from https://aistudio.google.com/app/apikey
GROK_API_KEY_1 = from https://console.x.ai/
GROK_API_KEY_2 = from https://console.x.ai/
```

### Step 2: Add to Vercel (2 min)
1. Go: https://vercel.com/dashboard
2. Select your project: `aylnor.ai`
3. Settings → Environment Variables
4. Add all 4 keys above
5. Click "Save"

### Step 3: Deploy (1 min)
1. Push to GitHub: `git push origin main`
2. Vercel auto-deploys
3. Wait 2-3 minutes
4. Done! ✅

---

## 🧪 Verify It Works

### Test via URL
```bash
# Check API status
curl https://your-vercel-url.vercel.app/api/chat/enhanced

# Test chat
curl -X POST https://your-vercel-url.vercel.app/api/chat/enhanced \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

---

## 🛠️ Local Development

```bash
# 1. Copy example
cp .env.example .env.local

# 2. Edit .env.local - add your API keys

# 3. Install
npm install

# 4. Run
npm run dev

# 5. Open http://localhost:3000
```

---

## 📊 All Environment Variables

### Required
- ✅ GEMINI_API_KEY_1
- ✅ GEMINI_API_KEY_2
- ✅ GROK_API_KEY_1
- ✅ GROK_API_KEY_2

### Optional (Database)
- ⭕ NEXT_PUBLIC_SUPABASE_URL
- ⭕ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ⭕ SUPABASE_SERVICE_ROLE_KEY

### Optional (Auth)
- ⭕ NEXTAUTH_URL
- ⭕ NEXTAUTH_SECRET

### Production
- ⭕ NEXT_PUBLIC_APP_URL

---

## ❌ Troubleshooting

| Issue | Fix |
|-------|-----|
| 503 Error | Check environment variables in Vercel |
| 502 Error | Check API keys are valid at provider |
| Timeout | Already set to 60s, check API provider |
| CORS Error | Only works from `aylnor-ai.vercel.app` |
| Chat not responding | Test keys with `test_keys` endpoint |

---

## 📞 Test Endpoints

### Simple Chat (No Database)
```
POST /api/chat
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "Hello"}
  ]
}
```

### Enhanced Chat (With Database)
```
POST /api/chat/enhanced
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "userId": "user-uuid",
  "sessionId": "session-uuid"
}
```

### Check Status
```
GET /api/chat/enhanced
```

---

## 🔐 Security Tips

1. Never commit `.env.local`
2. Use different keys for prod/dev
3. Rotate keys monthly
4. Monitor usage at providers
5. Check Vercel logs for errors

---

## 📈 Next Steps

1. ✅ Deploy on Vercel
2. ✅ Add environment variables
3. ✅ Test endpoints
4. ✅ Setup Supabase (optional)
5. ✅ Connect frontend
6. ✅ Monitor usage
7. ✅ Scale as needed

---

## 🎯 Key Fixes Applied

✅ Fixed stateless functions for Vercel
✅ Added comprehensive error handling
✅ Validated all inputs
✅ Increased timeout to 60s
✅ Fixed CORS for security
✅ Proper HTTP status codes
✅ Database optional
✅ Complete documentation

---

**You're all set! Push to deploy. 🚀**
