# SP1 — Backend Foundation Design Spec

**Date:** 2026-03-30
**Status:** Approved
**Sub-project:** 1 of 6

---

## Overview

Build the PetLife backend API from scratch: authentication, pet CRUD, health management, food tracking, medical records, and file uploads. This is the foundation that all other sub-projects depend on.

## Decisions Log

| Decision | Choice |
|----------|--------|
| Auth strategy | Email + password first, OAuth later |
| Hosting | Everything on Railway (backend + PostgreSQL) |
| Native wrapper | Capacitor (SP5) |
| File storage | Cloudflare R2 |
| Monetization | Freemium with paywall at launch |
| Implementation order | Sequential (SP1→SP2→SP3→SP4→SP5→SP6) |
| Middleware | Fastify plugins (no separate service) |

## Sub-Project Roadmap

| # | Sub-project | Depends on | Deliverable |
|---|------------|-----------|------------|
| **SP1** | Backend Foundation | — | API on Railway with auth, pets CRUD, health endpoints |
| **SP2** | Backend Community + Storage | SP1 | Posts, comments, likes, photo upload to R2 |
| **SP3** | Frontend Migration | SP1 | React app consuming real API instead of localStorage |
| **SP4** | Monetization (IAP) | SP1, SP3 | Premium plan via RevenueCat, paywall, feature gates |
| **SP5** | Capacitor + Native | SP3 | iOS/Android builds, push notifications, camera, biometrics |
| **SP6** | Store Launch | SP5 | Assets, compliance, listing, submit review |

---

## 1. Repository Structure

```
~/Documents/petlife/
├── petlife-frontend/          ← repo: sanchesnikollas/petlife-frontend
├── petlife-backend/           ← repo: sanchesnikollas/petlife-backend
├── petlife-docs/              ← repo: sanchesnikollas/petlife-docs
└── petlife/                   ← current MVP (archive after migration)
```

### Backend Project Structure

```
petlife-backend/
├── src/
│   ├── server.js              ← Fastify entry point
│   ├── config/
│   │   └── env.js             ← Zod-validated env vars
│   ├── plugins/
│   │   ├── auth.js            ← JWT verify decorator
│   │   ├── cors.js
│   │   ├── rateLimit.js
│   │   ├── errorHandler.js
│   │   └── petOwnership.js    ← verifies pet belongs to req.user
│   ├── routes/
│   │   ├── auth.js            ← register, login, refresh, forgot, reset
│   │   ├── me.js              ← tutor profile
│   │   ├── pets.js            ← CRUD pets + photo upload
│   │   ├── vaccines.js
│   │   ├── dewormings.js
│   │   ├── medications.js
│   │   ├── consultations.js
│   │   ├── food.js            ← food config + meals + weight
│   │   └── records.js         ← medical records + attachments
│   ├── schemas/               ← Zod schemas (request/response)
│   ├── services/              ← business logic
│   └── utils/
│       ├── password.js        ← bcrypt hash/compare
│       ├── jwt.js             ← sign/verify tokens
│       └── storage.js         ← R2 upload helper
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── tests/
│   ├── setup.js
│   ├── factories/
│   └── routes/
├── package.json
├── Dockerfile
├── .env.example
└── vitest.config.js
```

---

## 2. Middleware (Fastify Plugins)

| Plugin | Purpose | Scope |
|--------|---------|-------|
| Auth (JWT) | Verify token, inject `req.user` | All routes except `/auth/*` |
| Rate Limit | 100 req/min general, 5/min login | Global + per-route override |
| CORS | Whitelist frontend domain | Global |
| Validation | Zod schema validates body/params/query | Per route |
| Error Handler | Format errors to standard JSON | Global catch-all |
| Request Logger | Log request/response (time, status) | Global |
| File Size Limit | Max 5MB on uploads | Upload routes |
| Pet Ownership | Verify pet belongs to `req.user` | Routes `/pets/:petId/*` |

---

## 3. Auth Flow

### Register
```
POST /auth/register { name, email, password }
→ Zod validates (email regex, password ≥ 8 chars, name required)
→ Check email unique in DB
→ bcrypt hash (salt 12)
→ Create User in Prisma
→ Generate accessToken (JWT, 15min) + refreshToken (JWT, 7 days)
→ refreshToken in httpOnly secure SameSite=Strict cookie
→ Return { accessToken, user: { id, name, email, plan } }
```

### Login
```
POST /auth/login { email, password }
→ Find user by email
→ bcrypt compare
→ Generate tokens (same logic)
→ Return { accessToken, user }
```

### Refresh
```
POST /auth/refresh (cookie sent automatically)
→ Verify refreshToken from cookie
→ Generate new token pair (rotate refresh token)
→ Return { accessToken }
```

### Forgot Password
```
POST /auth/forgot { email }
→ Generate reset token (crypto.randomBytes, expires 1h)
→ Save token hash in DB
→ Send email via Resend with link: frontend.url/reset?token=xxx
→ Return 200 (always, even if email doesn't exist — security)
```

### Reset Password
```
POST /auth/reset { token, newPassword }
→ Verify token valid and not expired
→ bcrypt hash new password
→ Update user, clear token
→ Return 200
```

### Logout
```
DELETE /auth/logout
→ Clear refreshToken cookie
→ Frontend clears accessToken from memory
```

### Security Rules
- Password minimum 8 chars (App Store standard)
- Rate limit: 5 login attempts per minute per IP
- Refresh token rotated on every use (old token invalidated)
- No tokens in localStorage (XSS safe)

---

## 4. REST Endpoints

### Pets
```
GET    /pets              → list user's pets (with food config included)
POST   /pets              → create pet (returns complete pet)
GET    /pets/:petId       → detail with health summary
PATCH  /pets/:petId       → partial update
DELETE /pets/:petId       → soft delete (set deletedAt)
POST   /pets/:petId/photo → multipart upload → R2 → save URL
```

### Health (same pattern for all 4 resources)
```
GET    /pets/:petId/vaccines          → list with server-calculated status
POST   /pets/:petId/vaccines          → create + auto-create record
PATCH  /pets/:petId/vaccines/:id      → edit
DELETE /pets/:petId/vaccines/:id      → remove

(same for /dewormings, /medications, /consultations)
```

Server-side: vaccine status (`ok`/`due_soon`/`overdue`) is calculated based on `nextDue` vs current date.

### Food
```
GET    /pets/:petId/food              → current config
PATCH  /pets/:petId/food              → update config
GET    /pets/:petId/meals?date=YYYY-MM-DD  → meals for day
POST   /pets/:petId/meals             → log meal
GET    /pets/:petId/weight            → full history
POST   /pets/:petId/weight            → new entry
```

### Records
```
GET    /pets/:petId/records?type=vaccine&page=1&limit=20  → paginated + filter
POST   /pets/:petId/records           → create manually
PATCH  /pets/:petId/records/:id
DELETE /pets/:petId/records/:id
POST   /pets/:petId/records/:id/attachments  → upload exam → R2
GET    /pets/:petId/records/export     → generate PDF
```

### User
```
GET    /me                → tutor profile
PATCH  /me                → update name, phone, avatar
DELETE /me                → soft delete account
```

### Standard Response Format
```json
// Success
{ "data": { ... }, "meta": { "page": 1, "total": 42 } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": { "email": "Invalid format" } } }
```

---

## 5. Database Schema

Full Prisma schema as defined in architecture-design.md. Key models for SP1:

- **User** — id, name, email, passwordHash, phone, plan, provider, resetToken, resetTokenExpiry
- **Pet** — id, userId, name, species, breed, birthDate, sex, weight, photo, allergies, conditions, microchip, deletedAt
- **FoodConfig** — id, petId, brand, line, type, portionGrams, mealsPerDay, schedule
- **Vaccine** — id, petId, name, lastDone, nextDue, clinic, vet
- **Deworming** — id, petId, name, product, lastDone, nextDue
- **Medication** — id, petId, name, dose, frequency, startDate, duration, nextDue, active
- **Consultation** — id, petId, date, type, clinic, vet, notes
- **WeightEntry** — id, petId, date, value
- **MealLog** — id, petId, date, time, given
- **Record** — id, petId, date, type, title, description
- **Attachment** — id, recordId, filename, url, mimeType, size
- **ReminderConfig** — id, userId, vaccines, medications, food, consultations

Enums: Plan, AuthProvider, Species, Sex, FoodType, HealthStatus, RecordType

---

## 6. Infrastructure

### Railway Services
```
petlife-backend (service)
  ├── Dockerfile (Node 20 Alpine)
  ├── PORT=3001
  ├── DATABASE_URL=postgresql://...
  ├── JWT_SECRET=...
  ├── R2_ACCESS_KEY=...
  ├── RESEND_API_KEY=...
  └── FRONTEND_URL=https://petlife.app

petlife-postgres (database)
  └── Railway managed PostgreSQL
```

### Cloudflare R2
- Bucket: `petlife-uploads`
- Structure: `/{userId}/pets/{petId}/photo.jpg`, `/{userId}/records/{recordId}/exam.pdf`
- Public URL via R2 custom domain: `cdn.petlife.app`
- Max 5MB per upload, whitelist: jpg, png, webp, pdf

### Resend (email)
- Transactional templates: password reset, vaccine reminder, welcome
- Verified domain
- Free tier: 100 emails/day

### Environment Variables (.env.example)
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://localhost:5432/petlife
JWT_SECRET=change-me
JWT_REFRESH_SECRET=change-me-too
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=petlife-uploads
R2_PUBLIC_URL=https://cdn.petlife.app
RESEND_API_KEY=
FRONTEND_URL=http://localhost:5173
```

---

## 7. Monetization (Feature Gates)

| Feature | Free | Premium (R$14.90/mo) |
|---------|------|---------------------|
| Pets | 2 max | Unlimited |
| Vaccines, medications, consultations | Yes | Yes |
| Community (feed, groups, posts) | Yes | Yes |
| Social card | Basic | Full customization |
| Meal logging | Yes | Yes |
| Weight history | Last 3 months | Complete |
| Export PDF | No | Yes |
| Exam uploads | 3 per pet | Unlimited |
| Push reminders | Vaccines only | All |
| Food scanner | No | Yes |

Backend: `planGate(feature)` middleware returns `403 { error: { code: "PLAN_REQUIRED", feature: "pdf_export" } }`.

Payment processing (RevenueCat) deferred to SP4.

---

## 8. Testing Strategy

| Layer | Tool | Coverage |
|-------|------|----------|
| Unit | Vitest | Services, utils (jwt, password, storage) |
| Integration | Vitest + Supertest | Full routes (request → DB → response) |
| DB | Prisma + test DB | Migrations, seeds, queries |

Each route tests: happy path (201/200), validation (400), auth (401/403), not found (404).

### CI (GitHub Actions)
```
on push/PR:
  → npm ci
  → npx prisma migrate deploy (test DB)
  → npm run lint
  → npm test
  → npm run build
```

---

## 9. Security

| Area | Implementation |
|------|---------------|
| Auth | JWT (15min) + Refresh Token (7d) httpOnly cookie |
| Passwords | bcrypt salt rounds 12, minimum 8 chars |
| Rate Limiting | fastify-rate-limit (100 req/min, 5/min login) |
| CORS | Whitelist frontend origin |
| Input Validation | Zod schemas on every endpoint |
| SQL Injection | Prisma (parameterized queries) |
| XSS | React (auto-escape) + helmet headers |
| CSRF | SameSite=Strict cookie |
| Uploads | 5MB limit, mimetype whitelist |
| Data Privacy | Soft delete, export endpoint (LGPD) |
