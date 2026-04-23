# SP3 — Frontend Migration Design Spec

**Date:** 2026-03-31
**Status:** Approved
**Sub-project:** 3 of 6 (SP2 deferred — backend community endpoints not yet built)

---

## Overview

Migrate the PetLife frontend from localStorage to the real backend API. Replace PetContext's localStorage persistence with React Query hooks calling the SP1 API. Add real auth flow, loading states, error handling, and a Skeleton component.

## Decisions Log

| Decision | Choice |
|----------|--------|
| Migration strategy | Gradual in same repo, direct to API, no feature flag |
| State management | React Query (TanStack Query) for server data, Context for UI state |
| Auth token storage | Access token in memory (useRef), refresh token in httpOnly cookie |
| Scope | Auth + PetContext (pets, health, food, records). Community stays localStorage |

---

## 1. API Layer

### `src/lib/api.js` — Fetch wrapper

- Prepends `VITE_API_URL` to all requests
- Attaches `Authorization: Bearer <token>` automatically
- Includes `credentials: 'include'` for refresh token cookie
- Intercepts 401 → calls POST /auth/refresh → retries original request (once)
- Parses JSON and normalizes errors to `{ error: { code, message, fields } }`

Methods: `api.get(path)`, `api.post(path, body)`, `api.patch(path, body)`, `api.del(path)`

### Environment variable

- `.env` → `VITE_API_URL=http://localhost:3001`
- Railway → `VITE_API_URL=https://petlife-api-production-d707.up.railway.app`

---

## 2. AuthContext

### `src/context/AuthContext.jsx` — NEW

**State:**
- `user` — `{ id, name, email, plan }` or null
- `isAuthenticated` — boolean
- `isLoading` — true during initial refresh attempt

**Token storage:**
- `accessToken` in `useRef` (memory only, not in state to avoid re-renders)
- Exposed via `getAccessToken()` for api.js to read

**Functions:**
- `login(email, password)` → POST /auth/login → store user + token
- `register(name, email, password)` → POST /auth/register → store user + token
- `logout()` → DELETE /auth/logout → clear state → redirect to Login
- `refreshToken()` → POST /auth/refresh → update accessToken

**On mount:** attempts silent refresh (cookie may have valid refresh token). If succeeds, user is auto-logged-in. If fails, redirect to Login.

---

## 3. PetContext Rewrite

### `src/context/PetContext.jsx` — REWRITE (keep same hook name `usePet`)

Becomes thin — only UI state:
- `activePetId` / `switchPet(id)` — persisted in localStorage (just the ID)
- `pet` — derived from React Query cache via `usePets()`
- `pets` — from React Query cache
- `startAddingPet()` / `cancelAddingPet()` / `addingNewPet` — onboarding flow control
- `showToast(message, type)` — UI notifications

Everything else (CRUD, data) moves to React Query hooks.

---

## 4. React Query Hooks

All hooks live in `src/hooks/`. Each wraps `useQuery` and `useMutation` from @tanstack/react-query.

| Hook | Query Key | GET Endpoint | Mutations |
|------|-----------|-------------|-----------|
| `usePets()` | `['pets']` | GET /pets | create, update, delete |
| `useVaccines(petId)` | `['vaccines', petId]` | GET /pets/:petId/vaccines | add, update, delete |
| `useDewormings(petId)` | `['dewormings', petId]` | GET /pets/:petId/dewormings | add, update, delete |
| `useMedications(petId)` | `['medications', petId]` | GET /pets/:petId/medications | add, update, delete |
| `useConsultations(petId)` | `['consultations', petId]` | GET /pets/:petId/consultations | add, update, delete |
| `useFood(petId)` | `['food', petId]` | GET /pets/:petId/food | update |
| `useMeals(petId, date)` | `['meals', petId, date]` | GET /pets/:petId/meals?date= | log meal |
| `useWeight(petId)` | `['weight', petId]` | GET /pets/:petId/weight | add entry |
| `useRecords(petId, params)` | `['records', petId, params]` | GET /pets/:petId/records?type=&page= | create, update, delete |
| `useProfile()` | `['profile']` | GET /me | update, delete |

**Cache invalidation rules:**
- Mutate vaccine → invalidate `['vaccines', petId]` + `['records', petId]`
- Mutate medication → invalidate `['medications', petId]` + `['records', petId]`
- Mutate deworming → invalidate `['dewormings', petId]` + `['records', petId]`
- Mutate consultation → invalidate `['consultations', petId]` + `['records', petId]`
- Mutate weight → invalidate `['weight', petId]` + `['pets']` (pet.weight updates)
- Mutate pet → invalidate `['pets']`

**React Query config:**
- Retry: 3 for queries, 0 for mutations
- Stale time: 30 seconds (data refreshes in background)
- Cache time: 5 minutes

---

## 5. Loading States & Error Handling

### Loading
- First load → Skeleton shimmer (not spinner)
- Mutations → inline spinner on button + disabled
- Background refetch → silent (no UI change)

### Errors
| Error | UI Response |
|-------|------------|
| Network error | Toast: "Sem conexão. Tente novamente." |
| 400 Validation | Inline field errors (red borders) |
| 401 after refresh fails | Redirect to Login, clear AuthContext |
| 403 PLAN_REQUIRED | Toast: "Upgrade para Premium" (visual only until SP4) |
| 500 Server error | Toast: "Erro interno. Tente novamente." |

### New component: `src/components/Skeleton.jsx`
- Props: `width`, `height`, `rounded`, `className`
- Uses existing `.animate-shimmer` CSS class
- Reusable for cards, list items, text blocks

---

## 6. Page Changes

| Page | What Changes |
|------|-------------|
| **Login** | Call `authContext.login()` / `register()` → real API. Add forgot password flow (navigate to reset page) |
| **Onboarding** | Use `usePets().createMutation` → POST /pets. Remove localStorage pet creation |
| **Dashboard** | Replace `usePet()` data with `usePets()`, `useVaccines()`, `useMedications()`, `useMeals()`. Add Skeleton for first load |
| **Health** | Replace all `pet.vaccines` etc. with hooks. Add loading/error states per tab |
| **Food** | Replace `pet.food` with `useFood()`, `useMeals()`, `useWeight()`. Skeleton on chart |
| **Records** | Replace `pet.records` with `useRecords(petId, { type, page })`. Real pagination |
| **Settings** | Replace `tutor` with `useProfile()`. Real update via PATCH /me. Real logout |
| **TopBar** | Read from `usePets()` + `useProfile()` instead of PetContext |
| **PetHeader** | Read from React Query cache instead of PetContext |
| **Community** | NO CHANGES — stays localStorage until SP2 |

### Files removed after migration:
- `src/data/mockData.js` — data comes from API

### App.jsx changes:
- Wrap with `<QueryClientProvider>` and `<AuthProvider>`
- Auth gate: check `authContext.isAuthenticated` instead of PetContext flags
- Remove `hasSeenWelcome` / `hasCompletedOnboarding` from PetContext (handle in AuthContext or route guards)

---

## 7. Dependencies

```bash
npm install @tanstack/react-query
```

No other new dependencies needed.

---

## 8. Environment

```
# .env (development)
VITE_API_URL=http://localhost:3001

# Railway (production)
VITE_API_URL=https://petlife-api-production-d707.up.railway.app
```
