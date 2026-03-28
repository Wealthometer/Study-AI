# StudyAI — AI-Powered Study Platform

Full-stack university study planner with **Email/Password + Clerk (Google SSO)**, JWT auth, AI timetabling, flashcards, quizzes, Spark.E tutor, and collaborative groups.

---

## Quick Start

### 1. Database
```bash
mysql -u root -p < schema.sql
```

### 2. Backend
```bash
npm install
cp server/.env.example server/.env
# Edit server/.env — fill in DB, JWT, Clerk, and OpenRouter credentials
npm run dev    # → http://localhost:5003
```

### 3. Frontend
```bash
cd client
npm install
npm run dev    # → http://localhost:5173
```

Create `client/.env` with `VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx`.

---

## Setting Up Clerk (Google Sign‑In)

1. Create a project at **https://dashboard.clerk.com**
2. Enable **Google** as an OAuth provider (User & Authentication → Social connections)
3. Add **Publishable Key** and **Secret Key** to:
   - `client/.env` → `VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx`
   - `server/.env` → `CLERK_SECRET_KEY=sk_test_xxx`
4. Redirect URL: leave default or set `http://localhost:5173/auth/callback`
5. Start the apps: backend `npm run dev`, frontend `npm run dev`

### New OAuth flow
```
User clicks "Continue with Google" (Clerk)
  → Clerk handles the Google consent screen
  → Clerk returns to /auth/callback and sets a Clerk session
  → Frontend fetches a Clerk session token and calls:
       POST /api/auth/clerk/exchange  (Authorization: Bearer <Clerk session token>)
  → Backend verifies the Clerk token, finds/creates the user, issues the app JWT
  → App stores {token, user} and redirects to /dashboard
```

---

## Environment Variables (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `DB_*` | ✅ | MySQL connection details |
| `JWT_SECRET` | ✅ | Random string for signing tokens |
| `CLERK_SECRET_KEY` | ✅ for Clerk | From Clerk dashboard |
| `SERVER_URL` | ✅ for Clerk | Backend URL (`http://localhost:5003`) |
| `CLIENT_URL` | – | Frontend URL (`http://localhost:5173`) |
| `OPENROUTER_API_KEY` | ✅ for AI | From https://openrouter.ai/keys |

---

## Auth Endpoints

```
POST /api/auth/register               →  { token, user }
POST /api/auth/login                  →  { token, user }
GET  /api/auth/me             (JWT)   →  { user }
PUT  /api/auth/profile        (JWT)   →  { user }
PUT  /api/auth/password       (JWT)   →  { message }

POST /api/auth/clerk/exchange         →  { token, user } (pass Clerk session token in Authorization)
```

---

## Changed Files Summary

### Backend
| File | Change |
|---|---|
| `package.json` | Added `@clerk/express` + `@clerk/backend`; removed Passport deps |
| `server/app.js` | Removed session/Passport wiring (Clerk handles OAuth) |
| `server/controllers/authController.js` | Added Clerk session exchange endpoint |
| `server/routes/authRoutes.js` | Replaced Google routes with `POST /auth/clerk/exchange` |
| `schema.sql` | Added `clerk_id VARCHAR(255) UNIQUE` to `users` |
| `server/.env` | Added `CLERK_SECRET_KEY`, removed Passport/Google keys |

### Frontend
| File | Change |
|---|---|
| `client/src/hooks/useAuth.jsx` | Google login now delegates to Clerk; logout also signs out of Clerk |
| `client/src/pages/Login.jsx` | Google button triggers Clerk redirect |
| `client/src/pages/Register.jsx` | Google sign-up uses Clerk |
| `client/src/pages/GoogleCallback.jsx` | **Updated** — completes Clerk redirect and exchanges token |
| `client/src/App.jsx` | `/auth/callback` stays for Clerk redirect handling |
