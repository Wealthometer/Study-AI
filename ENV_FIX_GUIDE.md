# ⚙️ ENVIRONMENT CONFIGURATION - REQUIRED FIXES

This file documents the exact environment variables you need to set up.

## 🔴 CRITICAL - MUST FIX IMMEDIATELY

### 1. Gemini API Key (Currently: EMPTY)
**Issue**: AI features not working
**Solution**:
1. Go to https://aistudio.google.com/app/apikeys
2. Sign in with your Google account
3. Click "Create API Key"
4. **Copy the API key**
5. Update server/.env:
   ```
   GEMINI_API_KEY=your_actual_key_here
   ```

### 2. Gemini API URL (Currently: WRONG)
**Issue**: Pointing to OpenAI instead of Google
**Current (WRONG)**: https://api.openai.com/v1/chat/completions
**Correct**: https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent

Update server/.env:
```
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent
GEMINI_MODEL=gemini-1.5-pro
```

---

## 🟡 LIKELY ISSUES - Verify These

### 3. Database Connection
Check/Fix in server/.env:
```
DB_HOST=localhost        (should be 'localhost' or your DB server)
DB_PORT=3309            (verify this matches your MySQL port - default is 3306)
DB_USER=root            (your MySQL user)
DB_PASSWORD=            (your DB password, if any)
DB_NAME=studyfetch3     (must match the database name)
```

### 4. Clerk Authentication
**Issue**: Google login not working
**Solution**: Verify in server/.env:
```
CLERK_PUBLISHABLE_KEY=pk_test_...  (from Clerk Dashboard)
CLERK_SECRET_KEY=sk_test_...       (from Clerk Dashboard)
CLIENT_URL=http://localhost:5173   (frontend URL)
SERVER_URL=http://localhost:5003   (backend URL)
```

---

## 📋 COMPLETE .env FILE TEMPLATE

Copy this into `server/.env` and fill in your values:

```env
# ✅ CORE SERVER
PORT=5003
SERVER_URL=http://localhost:5003
CLIENT_URL=http://localhost:5173

# ✅ DATABASE (MySQL)
DB_HOST=localhost
DB_USER=root
DB_PORT=3309
DB_PASSWORD=
DB_NAME=studyfetch3

# ✅ AUTHENTICATION
JWT_SECRET=studyai_super_secret_jwt_key_change_in_production
JWT_EXPIRE=14d

# 🔴 CRITICAL - GEMINI AI API (FIX THIS!)
GEMINI_API_KEY=PUT_YOUR_API_KEY_HERE
GEMINI_MODEL=gemini-1.5-pro
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent

# 🟡 CLERK AUTHENTICATION (Google OAuth)
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# 📁 FILE UPLOADS
UPLOAD_DIR=uploads
MAX_FILE_SIZE=50000000

# ⚙️ OPTIONAL - Fallback AI (if Gemini fails)
OPENROUTER_API_KEY=sk-or-v1-... (optional)
```

---

## ✅ STEP-BY-STEP FIX GUIDE

### Step 1: Get Gemini API Key (5 minutes)
```bash
# 1. Open: https://aistudio.google.com/app/apikeys
# 2. Click: "Create API Key"
# 3. Select: "Create API key in new project"
# 4. Copy the key (looks like: AIzaSy...)
```

### Step 2: Update server/.env
```bash
# Open: server/.env
# Find: GEMINI_API_KEY=
# Change to: GEMINI_API_KEY=AIzaSy...PASTE_HERE...
# Save file
```

### Step 3: Restart Server
```bash
# Kill running server (Ctrl+C)
# Restart: npm start
# You should see: "✅ MySQL Connected" (if DB is running)
```

### Step 4: Test AI
```bash
# In browser console:
fetch('http://localhost:5003/api/ai/study-suggestion', {
  headers: {'Authorization': 'Bearer YOUR_TOKEN'}
})
.then(r => r.json())
.then(d => console.log(d))
```

---

## 🧪 VERIFICATION CHECKLIST

After updating .env, verify:

- [ ] GEMINI_API_KEY is not empty
- [ ] GEMINI_API_KEY is valid (starts with AIza...)
- [ ] GEMINI_API_URL points to Google (not OpenAI)
- [ ] DB_HOST and DB_PORT are correct
- [ ] MySQL server is running
- [ ] Server restarts without errors
- [ ] AI endpoints respond (not 401 errors)

---

## 🆘 TROUBLESHOOTING

**Error: "No AI API key configured"**
→ GEMINI_API_KEY is empty or not set

**Error: "AI request error 401"**
→ GEMINI_API_KEY is invalid, get a new one

**Error: "MySQL connection failed"**
→ Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD

**Error: "Clerk is still loading"**
→ CLERK_PUBLISHABLE_KEY missing or invalid

---

## 🚀 WHAT TO DO NOW

1. **Copy the template above**
2. **Paste into `server/.env`**
3. **Get Gemini API key** from https://aistudio.google.com/app/apikeys
4. **Update GEMINI_API_KEY=** with your key
5. **Save file**
6. **Restart server**
7. **Test in browser**

---

**Last Updated**: April 9, 2026
**Created for**: StudyAI Fix
