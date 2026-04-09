# 🚀 Complete Setup & Troubleshooting Guide

## ⚠️ CRITICAL SETUP ISSUES & FIXES

### Issue 1: Gemini API Not Configured
**Status**: ❌ NOT WORKING

**Solution**:
1. Get your Gemini API Key:
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikeys)
   - Click "Create API Key"
   - Copy the key

2. Update `.env` file in `/server/`:
```env
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent
OPENROUTER_API_KEY=sk-or-v1-... (optional fallback)
```

3. **Restart server** after updating .env

---

### Issue 2: Clerk Google OAuth Not Working
**Status**: ⚠️ POTENTIAL ISSUE

**Solution A - Quick Fix**:
In your `server/.env`:
```env
CLERK_PUBLISHABLE_KEY=pk_test_... (from Clerk Dashboard)
CLERK_SECRET_KEY=sk_test_... (from Clerk Dashboard)
```

**Solution B - Full Setup**:
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click **Integrations** → **OAuth Applications**
3. **Add Google OAuth**:
   - Authorized URLs: `http://localhost:5173` (development)
   - Callback URLs: `http://localhost:5173/auth/callback`
4. Get Client ID and Secret
5. In Clerk Dashboard → Social Providers → Enable Google
6. Map the OAuth credentials

**Solution C - Debug**:
```bash
# In browser console on login page:
console.log("Clerk Loaded:", window.Clerk)
console.log("OAuth Status:", window.Clerk?.loaded)
```

---

## 🆕 NEW FEATURES IMPLEMENTED

### Feature 1: AI Study Plan Generator
Generates structured, day-by-day study plans for books/materials

**Endpoint**: `POST /api/ai/study-plan`
**Body**:
```json
{
  "subject_id": 1,
  "material_id": 2,
  "duration_days": 7,
  "intensity": "balanced"
}
```

**Response**:
```json
{
  "plan": {
    "title": "7-Day Calculus Study Plan",
    "overview": "Master integration techniques",
    "daily_schedule": [
      {
        "day": 1,
        "topic": "Introduction to Integration",
        "topics": ["antiderivatives", "indefinite integrals"],
        "duration_minutes": 90,
        "materials": ["Chapter 8.1", "Examples PDF"],
        "tasks": ["Read chapter", "Do practice problems 1-10"],
        "quiz_focus": "Basic concepts"
      }
      // ... more days
    ],
    "total_hours": 12,
    "difficulty_progression": "easy→medium→hard"
  }
}
```

---

### Feature 2: Enhanced AI Timetable
Timetable now includes:
- ✅ Subject-specific topics from materials
- ✅ Materials to use during study sessions
- ✅ Performance-based adjustments
- ✅ Break recommendations

**Endpoint**: `POST /api/ai/timetable/generate`
**Body**:
```json
{
  "date": "2026-04-10",
  "days": 7,
  "focus_subjects": [1, 2, 3]
}
```

**Response includes**:
- Daily schedule with topics
- Recommended materials for each session
- Difficulty based on performance
- Break times and transitions

---

### Feature 3: Performance-Based Suggestions
If no materials uploaded, AI suggests topics based on:
- Current mastery scores
- Quiz performance
- Weak areas
- Learning patterns

**Endpoint**: `GET /api/ai/suggest-topics`

**Response**:
```json
{
  "suggestions": [
    {
      "subject": "Mathematics",
      "weak_areas": ["Integration", "Limits"],
      "recommended_topics": ["Advanced Integration", "Limit Theory"],
      "resources_to_study": "Textbook Chapter 9",
      "estimated_hours": 5
    }
  ]
}
```

---

## 📋 COMPLETE SETUP CHECKLIST

### Step 1: Environment Variables ✓
- [ ] GEMINI_API_KEY set and valid
- [ ] CLERK_SECRET_KEY set
- [ ] DB credentials correct
- [ ] SERVER_URL and CLIENT_URL match

### Step 2: Database ✓
- [ ] MySQL running on port 3309
- [ ] Database `studyfetch3` exists
- [ ] Tables created from schema.sql

### Step 3: Dependencies ✓
- [ ] `npm install` completed in `/server`
- [ ] `npm install` completed in `/client`

### Step 4: Clerk Setup ✓
- [ ] Clerk account created
- [ ] Google OAuth enabled
- [ ] Redirect URIs configured
- [ ] Environment keys updated

### Step 5: Start Application ✓
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
cd client
npm run dev
```

---

## 🔧 TROUBLESHOOTING

### AI Responses Not Working
**Error**: "AI API error 401" or "No API key"
**Fix**:
1. Check GEMINI_API_KEY in `.env`
2. Verify it's not empty: `echo $GEMINI_API_KEY`
3. Test endpoint: `curl -H "Authorization: Bearer KEY" https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=YOUR_KEY`

### Clerk Login Button Not Working
**Error**: "Auth is still loading"
**Fix**:
1. Open DevTools → Network tab
2. Check if `https://accounts.clerk.dev` loads
3. Verify CLERK_PUBLISHABLE_KEY in client `.env`
4. Clear localStorage and try again

### Database Connection Failed
**Error**: "MySQL connection failed" on startup
**Fix**:
```bash
# Check MySQL is running
mysql -h localhost -P 3309 -u root

# If failed, start MySQL
# Windows: `mysqld` or check Services
# Mac: `brew services start mysql`
# Linux: `sudo service mysql start`
```

---

## 📝 API Testing with cURL

### Test Gemini AI
```bash
curl -X POST "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello"}]
    }]
  }'
```

### Test Study Plan Generation
```bash
curl -X POST http://localhost:5003/api/ai/study-plan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject_id": 1,
    "material_id": 2,
    "duration_days": 7,
    "intensity": "balanced"
  }'
```

---

## 🎯 Quick Fixes Priority

**Priority 1 (Do First)**:
✅ Fix GEMINI_API_KEY (blocks all AI features)
✅ Restart server

**Priority 2 (Do Second)**:
✅ Test login with email/password
✅ If works, setup Clerk OAuth

**Priority 3 (Then)**:
✅ Test all AI features
✅ Create subjects/materials
✅ Test new study plan feature

---

## 💡 Need Help?

**Check logs**:
```bash
# Server logs
npm start  # Shows all errors

# Browser console
F12 → Console → Look for errors
```

**Test endpoints**:
- `http://localhost:5003/` should return "StudyAI API v2.0"
- `http://localhost:5003/api/subjects` (with auth) should list your subjects

**Verify Auth**:
```bash
# Get token from login, then:
curl http://localhost:5003/api/subjects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Last Updated**: April 9, 2026
**Status**: Setup Guide Complete ✅
