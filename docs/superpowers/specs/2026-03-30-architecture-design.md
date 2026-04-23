# PetLife — Arquitetura Completa para Produção

**Date:** 2026-03-30
**Status:** Draft — aguardando aprovação

---

## 1. Visão Geral

Migrar o PetLife de um app 100% client-side (localStorage) para uma arquitetura full-stack com autenticação real, banco de dados, API, storage de arquivos e notificações push. Manter o frontend React existente, substituindo localStorage por chamadas à API.

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  React 19 + Vite + Tailwind (já existe)         │
│  → substituir localStorage por API calls         │
│  → adicionar auth flow real (JWT)               │
│  → PWA (manifest + service worker)              │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS / REST + WebSocket
┌──────────────────▼──────────────────────────────┐
│                   BACKEND                        │
│  Node.js + Fastify (ou Express)                 │
│  → Auth (JWT + refresh tokens)                  │
│  → REST API (/api/v1/*)                         │
│  → WebSocket (notificações real-time)           │
│  → Upload handler (S3/R2)                       │
│  → Cron jobs (lembretes, notificações)          │
└──────────┬────────┬────────┬────────────────────┘
           │        │        │
     ┌─────▼──┐ ┌───▼───┐ ┌─▼──────────┐
     │ Postgres│ │ Redis │ │ S3/R2      │
     │ (dados)│ │(cache)│ │(arquivos)  │
     └────────┘ └───────┘ └────────────┘
```

---

## 2. Backend — API

### 2.1 Stack Recomendada
| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Runtime | Node.js 20 | Mesmo ecossistema do frontend |
| Framework | Fastify | Performance, schema validation nativo, plugins |
| ORM | Prisma | Type-safe, migrations, bom DX |
| Auth | JWT + bcrypt | Stateless, refresh tokens em httpOnly cookie |
| Validation | Zod | Compartilhável com frontend |
| File Upload | Multer + S3 SDK | Streaming direto pro storage |
| Real-time | Socket.io | WebSocket com fallback |
| Cron | node-cron | Lembretes e notificações agendadas |
| Email | Resend | Transacional (reset senha, lembretes) |

### 2.2 Endpoints REST

#### Auth
```
POST   /api/v1/auth/register      { name, email, password }
POST   /api/v1/auth/login         { email, password }
POST   /api/v1/auth/refresh       (cookie httpOnly)
POST   /api/v1/auth/forgot        { email }
POST   /api/v1/auth/reset         { token, newPassword }
POST   /api/v1/auth/google        { idToken }
POST   /api/v1/auth/apple         { identityToken }
DELETE /api/v1/auth/logout
```

#### Tutor (User)
```
GET    /api/v1/me                 → perfil do tutor
PATCH  /api/v1/me                 { name, phone, avatar }
DELETE /api/v1/me                 → soft delete conta
GET    /api/v1/me/subscription    → plano atual
POST   /api/v1/me/subscription    → upgrade/downgrade
```

#### Pets
```
GET    /api/v1/pets               → lista pets do tutor
POST   /api/v1/pets               → criar pet (onboarding)
GET    /api/v1/pets/:id           → detalhe do pet
PATCH  /api/v1/pets/:id           → atualizar pet
DELETE /api/v1/pets/:id           → remover pet
POST   /api/v1/pets/:id/photo     → upload foto (multipart)
```

#### Saúde
```
GET    /api/v1/pets/:id/vaccines
POST   /api/v1/pets/:id/vaccines
PATCH  /api/v1/pets/:id/vaccines/:vid
DELETE /api/v1/pets/:id/vaccines/:vid

GET    /api/v1/pets/:id/dewormings
POST   /api/v1/pets/:id/dewormings
PATCH  /api/v1/pets/:id/dewormings/:did
DELETE /api/v1/pets/:id/dewormings/:did

GET    /api/v1/pets/:id/medications
POST   /api/v1/pets/:id/medications
PATCH  /api/v1/pets/:id/medications/:mid
DELETE /api/v1/pets/:id/medications/:mid

GET    /api/v1/pets/:id/consultations
POST   /api/v1/pets/:id/consultations
PATCH  /api/v1/pets/:id/consultations/:cid
DELETE /api/v1/pets/:id/consultations/:cid
```

#### Alimentação
```
GET    /api/v1/pets/:id/food           → config alimentação
PATCH  /api/v1/pets/:id/food           → atualizar config
GET    /api/v1/pets/:id/meals          → log de refeições
POST   /api/v1/pets/:id/meals          → registrar refeição
GET    /api/v1/pets/:id/weight         → histórico peso
POST   /api/v1/pets/:id/weight         → registrar peso
```

#### Prontuário
```
GET    /api/v1/pets/:id/records        → todos registros (filtro por ?type=)
POST   /api/v1/pets/:id/records        → adicionar registro
PATCH  /api/v1/pets/:id/records/:rid
DELETE /api/v1/pets/:id/records/:rid
POST   /api/v1/pets/:id/records/:rid/attachments  → upload exame
GET    /api/v1/pets/:id/records/export  → PDF do prontuário
```

#### Comunidade
```
GET    /api/v1/community/groups                → listar grupos
GET    /api/v1/community/groups/:gid           → detalhe do grupo
POST   /api/v1/community/groups/:gid/follow    → seguir
DELETE /api/v1/community/groups/:gid/follow     → desseguir

GET    /api/v1/community/feed                  → feed (grupos seguidos, paginado)
GET    /api/v1/community/groups/:gid/posts     → posts do grupo (paginado)
POST   /api/v1/community/posts                 → criar post
PATCH  /api/v1/community/posts/:pid            → editar post
DELETE /api/v1/community/posts/:pid            → deletar post
POST   /api/v1/community/posts/:pid/like       → curtir
DELETE /api/v1/community/posts/:pid/like        → descurtir
POST   /api/v1/community/posts/:pid/share      → registrar compartilhamento

GET    /api/v1/community/posts/:pid/comments   → listar comentários
POST   /api/v1/community/posts/:pid/comments   → comentar
DELETE /api/v1/community/comments/:cid         → deletar comentário

GET    /api/v1/community/card/:petId           → cartão social público
PATCH  /api/v1/community/card                  → atualizar cartão
```

#### Notificações
```
GET    /api/v1/notifications           → listar (paginado)
PATCH  /api/v1/notifications/:nid      → marcar como lida
POST   /api/v1/notifications/subscribe → push subscription (web push)
PATCH  /api/v1/me/reminders            → config lembretes
```

---

## 3. Banco de Dados — Schema (Prisma)

```prisma
model User {
  id                String   @id @default(cuid())
  name              String
  email             String   @unique
  passwordHash      String?
  phone             String?
  avatar            String?
  plan              Plan     @default(FREE)
  provider          AuthProvider @default(EMAIL)
  providerId        String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?

  pets              Pet[]
  posts             Post[]
  comments          Comment[]
  likes             Like[]
  follows           GroupFollow[]
  notifications     Notification[]
  pushSubscriptions PushSubscription[]
  petCards          PetCard[]
  reminders         ReminderConfig?
}

model Pet {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  name          String
  species       Species
  breed         String
  birthDate     DateTime
  sex           Sex
  weight        Float
  photo         String?
  allergies     String[]
  conditions    String?
  microchip     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  food          FoodConfig?
  vaccines      Vaccine[]
  dewormings    Deworming[]
  medications   Medication[]
  consultations Consultation[]
  weightHistory WeightEntry[]
  mealLog       MealLog[]
  records       Record[]
  petCard       PetCard?
}

model FoodConfig {
  id            String @id @default(cuid())
  petId         String @unique
  pet           Pet    @relation(fields: [petId], references: [id], onDelete: Cascade)
  brand         String
  line          String?
  type          FoodType
  portionGrams  Int
  mealsPerDay   Int
  schedule      String[]   // ["08:00", "19:00"]
}

model Vaccine {
  id        String   @id @default(cuid())
  petId     String
  pet       Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  name      String
  lastDone  DateTime
  nextDue   DateTime
  status    HealthStatus @default(OK)
  clinic    String?
  vet       String?
  createdAt DateTime @default(now())
}

model Deworming {
  id        String   @id @default(cuid())
  petId     String
  pet       Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  name      String
  product   String?
  lastDone  DateTime
  nextDue   DateTime
  status    HealthStatus @default(OK)
  createdAt DateTime @default(now())
}

model Medication {
  id          String   @id @default(cuid())
  petId       String
  pet         Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  name        String
  dose        String
  frequency   String
  startDate   DateTime
  duration    Int      // days
  nextDue     DateTime?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model Consultation {
  id        String   @id @default(cuid())
  petId     String
  pet       Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  date      DateTime
  type      String
  clinic    String?
  vet       String?
  notes     String?
  createdAt DateTime @default(now())
}

model WeightEntry {
  id        String   @id @default(cuid())
  petId     String
  pet       Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  date      String   // "2025-03" format
  value     Float
  createdAt DateTime @default(now())
}

model MealLog {
  id        String   @id @default(cuid())
  petId     String
  pet       Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  date      String
  time      String
  given     Boolean  @default(true)
  createdAt DateTime @default(now())
}

model Record {
  id          String      @id @default(cuid())
  petId       String
  pet         Pet         @relation(fields: [petId], references: [id], onDelete: Cascade)
  date        DateTime
  type        RecordType
  title       String
  description String?
  createdAt   DateTime    @default(now())
  attachments Attachment[]
}

model Attachment {
  id        String @id @default(cuid())
  recordId  String
  record    Record @relation(fields: [recordId], references: [id], onDelete: Cascade)
  filename  String
  url       String
  mimeType  String
  size      Int
  createdAt DateTime @default(now())
}

// ─── Community ───

model CommunityGroup {
  id       String @id @default(cuid())
  name     String @unique
  emoji    String
  category GroupCategory
  members  Int    @default(0) // denormalized count

  posts    Post[]
  follows  GroupFollow[]
}

model GroupFollow {
  id        String         @id @default(cuid())
  userId    String
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  groupId   String
  group     CommunityGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  createdAt DateTime       @default(now())

  @@unique([userId, groupId])
}

model Post {
  id        String         @id @default(cuid())
  userId    String
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  groupId   String
  group     CommunityGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  image     String?
  caption   String
  likes     Int            @default(0) // denormalized
  shares    Int            @default(0)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  likesList Like[]
  comments  Comment[]
}

model Like {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, postId])
}

model Comment {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  text      String
  createdAt DateTime @default(now())
}

model PetCard {
  id             String  @id @default(cuid())
  petId          String  @unique
  pet            Pet     @relation(fields: [petId], references: [id], onDelete: Cascade)
  userId         String
  user           User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  city           String?
  personality    String?
  visibleFields  Json    // { name: true, breed: true, ... }
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      NotificationType
  title     String
  body      String
  read      Boolean  @default(false)
  data      Json?    // { petId, vaccineId, etc }
  createdAt DateTime @default(now())
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint  String
  keys      Json
  createdAt DateTime @default(now())
}

model ReminderConfig {
  id              String  @id @default(cuid())
  userId          String  @unique
  user            User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  vaccines        Boolean @default(true)
  medications     Boolean @default(true)
  food            Boolean @default(true)
  consultations   Boolean @default(true)
}

// ─── Enums ───

enum Plan { FREE PREMIUM }
enum AuthProvider { EMAIL GOOGLE APPLE }
enum Species { DOG CAT }
enum Sex { MALE FEMALE }
enum FoodType { DRY WET MIXED }
enum HealthStatus { OK DUE_SOON OVERDUE }
enum RecordType { VACCINE MEDICATION CONSULTATION EXAM DEWORMING }
enum GroupCategory { BREED CITY TOPIC }
enum NotificationType { VACCINE_DUE MEDICATION_DUE MEAL_REMINDER CONSULTATION_DUE COMMUNITY_LIKE COMMUNITY_COMMENT }
```

---

## 4. Infraestrutura

### 4.1 Deploy
| Serviço | Provider | Tier |
|---------|----------|------|
| Frontend (SPA) | Vercel ou Railway | Free/Hobby |
| Backend (API) | Railway | Starter ($5/mo) |
| Database | Railway PostgreSQL ou Supabase | Free tier |
| Redis (cache) | Railway Redis ou Upstash | Free tier |
| File Storage | Cloudflare R2 | Free tier (10GB) |
| Email | Resend | Free tier (100/day) |
| Domínio | Cloudflare | ~$10/year |

**Custo estimado:** $5-15/mês para MVP

### 4.2 CI/CD
```
GitHub Actions:
  push to main → build + test → deploy backend (Railway)
  push to main → build frontend → deploy (Vercel/Railway)
  PR → run tests + lint + type-check
```

### 4.3 Monitoramento
- **Logs:** Railway built-in
- **Errors:** Sentry (free tier)
- **Uptime:** BetterStack (free tier)
- **Analytics:** Plausible ou Umami (self-hosted)

---

## 5. Frontend — Mudanças Necessárias

### 5.1 API Layer
Criar `src/lib/api.js` com fetch wrapper:
- Base URL configurável (env var)
- JWT attach automático (Authorization header)
- Refresh token automático (401 → refresh → retry)
- Error handling centralizado

### 5.2 Migração de Contexto
- `PetContext` → substituir localStorage por API calls
- `CommunityContext` → substituir localStorage por API calls
- Adicionar loading/error states em cada operação
- Adicionar React Query ou SWR para cache + revalidation

### 5.3 Auth Flow
- Login/Register → POST real → JWT em memória + refresh em cookie
- Google/Apple OAuth → flow real com redirect
- Forgot Password → email real via API
- Logout → limpar tokens + redirect

### 5.4 PWA
- `manifest.json` (name, icons, theme_color, start_url)
- Service Worker (cache-first para assets, network-first para API)
- Push notifications (Web Push API)
- Install prompt

### 5.5 Upload Real
- Exames: multipart upload → S3/R2 → URL salva no record
- Foto do pet: multipart → resize no backend → S3/R2
- Foto de post: multipart → S3/R2

---

## 6. Segurança

| Área | Implementação |
|------|--------------|
| Autenticação | JWT (15min) + Refresh Token (7d) httpOnly cookie |
| Senhas | bcrypt salt rounds 12 |
| Rate Limiting | fastify-rate-limit (100 req/min geral, 5/min login) |
| CORS | Whitelist origin do frontend |
| Input Validation | Zod schemas em todo endpoint |
| SQL Injection | Prisma (parameterized queries) |
| XSS | React (escape automático) + helmet headers |
| CSRF | SameSite=Strict no cookie |
| Upload | Limit 5MB, whitelist mimetypes, virus scan opcional |
| Dados pessoais | Soft delete, export (LGPD compliance) |

---

## 7. Fases de Implementação

### Fase 1: Foundation (1-2 semanas)
- [ ] Setup projeto backend (Fastify + Prisma + PostgreSQL)
- [ ] Schema + migrations
- [ ] Auth endpoints (register, login, refresh, logout)
- [ ] CRUD de pets
- [ ] Frontend: API layer + auth flow real
- [ ] Deploy backend no Railway

### Fase 2: Core Features (2-3 semanas)
- [ ] Endpoints de saúde (vacinas, vermífugos, medicações, consultas)
- [ ] Endpoints de alimentação (food config, meals, weight)
- [ ] Endpoints de prontuário (records + attachments)
- [ ] Upload de fotos e exames (S3/R2)
- [ ] Frontend: migrar PetContext para API
- [ ] Export prontuário em PDF

### Fase 3: Comunidade (1-2 semanas)
- [ ] Endpoints de comunidade (posts, comments, likes, groups, follows)
- [ ] Upload de imagem para posts
- [ ] Cartão social público
- [ ] Frontend: migrar CommunityContext para API
- [ ] Paginação infinita no feed

### Fase 4: Notificações + PWA (1 semana)
- [ ] Cron jobs para verificar vacinas/medicações vencendo
- [ ] Web Push notifications
- [ ] Email de lembretes (Resend)
- [ ] PWA manifest + service worker
- [ ] Install prompt

### Fase 5: Polish + Launch (1 semana)
- [ ] Google/Apple OAuth real
- [ ] Domínio custom
- [ ] SEO + Open Graph tags
- [ ] Sentry error tracking
- [ ] Testes E2E (Playwright)
- [ ] Landing page

---

## 8. Decisões de Trade-off

| Decisão | Escolha | Alternativa | Justificativa |
|---------|---------|-------------|---------------|
| Framework backend | Fastify | NestJS | Mais leve, menos boilerplate para MVP |
| ORM | Prisma | Drizzle | Melhor DX, migrations automáticas |
| Banco | PostgreSQL | MongoDB | Relacional se encaixa no modelo de dados |
| Cache | React Query | SWR | Melhor devtools, mutations nativas |
| Storage | Cloudflare R2 | AWS S3 | Free tier generoso, egress grátis |
| Auth | JWT custom | Auth0/Clerk | Controle total, sem vendor lock-in, mais barato |
| Real-time | Socket.io | SSE | Bidirecional, fallback automático |
| Email | Resend | SendGrid | DX superior, pricing justo |
