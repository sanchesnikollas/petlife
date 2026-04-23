# SP1 — Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the PetLife backend API with auth, pet CRUD, health management, food tracking, and medical records.

**Architecture:** Node.js + Fastify + Prisma + PostgreSQL. JWT auth with refresh tokens. Cloudflare R2 for file storage. Zod for validation. TDD with Vitest.

**Tech Stack:** Node.js 20, Fastify 5, Prisma 6, PostgreSQL 16, Zod, bcrypt, jsonwebtoken, @aws-sdk/client-s3, resend, vitest

---

## Task 1: Project Scaffolding

**Files:**
- `petlife-backend/package.json`
- `petlife-backend/.env.example`
- `petlife-backend/.gitignore`
- `petlife-backend/Dockerfile`
- `petlife-backend/vitest.config.js`
- `petlife-backend/src/server.js`
- `petlife-backend/tests/routes/health.test.js`

### Steps

- [ ] **1.1** Create the project directory and initialize with package.json

```bash
cd ~/Documents/petlife
mkdir -p petlife-backend/src/{config,plugins,routes,schemas,services,utils}
mkdir -p petlife-backend/tests/{routes,factories}
mkdir -p petlife-backend/prisma
```

- [ ] **1.2** Create `petlife-backend/package.json`

```json
{
  "name": "petlife-backend",
  "version": "1.0.0",
  "description": "PetLife backend API — prontuario e assistente de vida para pets",
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "db:migrate": "npx prisma migrate dev",
    "db:push": "npx prisma db push",
    "db:seed": "node prisma/seed.js",
    "db:studio": "npx prisma studio",
    "lint": "eslint src/"
  },
  "dependencies": {
    "fastify": "^5.2.1",
    "@fastify/cors": "^11.0.0",
    "@fastify/rate-limit": "^10.2.0",
    "@fastify/cookie": "^11.0.1",
    "@fastify/multipart": "^9.0.3",
    "@prisma/client": "^6.4.1",
    "zod": "^3.24.2",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "@aws-sdk/client-s3": "^3.750.0",
    "resend": "^4.1.2"
  },
  "devDependencies": {
    "prisma": "^6.4.1",
    "vitest": "^3.0.7",
    "eslint": "^9.20.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **1.3** Create `petlife-backend/.env.example`

```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://localhost:5432/petlife
JWT_SECRET=change-me-in-production
JWT_REFRESH_SECRET=change-me-too-in-production
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=petlife-uploads
R2_PUBLIC_URL=https://cdn.petlife.app
RESEND_API_KEY=
FRONTEND_URL=http://localhost:5173
```

- [ ] **1.4** Create `petlife-backend/.gitignore`

```
node_modules/
dist/
.env
.env.local
.env.production
*.log
coverage/
.DS_Store
prisma/migrations/**/migration_lock.toml
```

- [ ] **1.5** Create `petlife-backend/Dockerfile`

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src/

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
```

- [ ] **1.6** Create `petlife-backend/vitest.config.js`

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
```

- [ ] **1.7** Create `petlife-backend/src/server.js`

```js
import Fastify from 'fastify';

export function buildApp(opts = {}) {
  const app = Fastify({
    logger: opts.logger ?? (process.env.NODE_ENV !== 'test'),
    ...opts,
  });

  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}

async function start() {
  const app = buildApp();
  const port = parseInt(process.env.PORT || '3001', 10);
  const host = '0.0.0.0';

  try {
    await app.listen({ port, host });
    console.log(`PetLife API running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  start();
}
```

- [ ] **1.8** Create `petlife-backend/tests/setup.js` (minimal for now, expanded in Task 3)

```js
// tests/setup.js — global test setup
// Will be expanded with DB cleanup in Task 3
```

- [ ] **1.9** Create `petlife-backend/tests/routes/health.test.js`

```js
import { describe, it, expect } from 'vitest';
import { buildApp } from '../../src/server.js';

describe('GET /health', () => {
  it('should return 200 with status ok', async () => {
    const app = buildApp({ logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.payload);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();

    await app.close();
  });
});
```

- [ ] **1.10** Install dependencies and run the test

```bash
cd ~/Documents/petlife/petlife-backend
npm install
npx vitest run tests/routes/health.test.js
```

Expected output:
```
 ✓ tests/routes/health.test.js (1)
   ✓ GET /health (1)
     ✓ should return 200 with status ok

 Test Files  1 passed (1)
 Tests       1 passed (1)
```

- [ ] **1.11** Commit

```bash
cd ~/Documents/petlife/petlife-backend
git init
git add -A
git commit -m "feat(sp1): project scaffolding with Fastify health check

Initialize petlife-backend with Fastify 5, Vitest, Prisma, and all
required dependencies. Basic health check endpoint passes."
```

---

## Task 2: Environment Config & Error Handler

**Files:**
- `petlife-backend/src/config/env.js`
- `petlife-backend/src/plugins/errorHandler.js`
- `petlife-backend/tests/config/env.test.js`
- `petlife-backend/tests/plugins/errorHandler.test.js`

### Steps

- [ ] **2.1** Create `petlife-backend/src/config/env.js`

```js
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().url().default('postgresql://localhost:5432/petlife'),
  JWT_SECRET: z.string().min(10).default('dev-jwt-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().min(10).default('dev-refresh-secret-change-me'),
  R2_ACCOUNT_ID: z.string().default(''),
  R2_ACCESS_KEY_ID: z.string().default(''),
  R2_SECRET_ACCESS_KEY: z.string().default(''),
  R2_BUCKET_NAME: z.string().default('petlife-uploads'),
  R2_PUBLIC_URL: z.string().default('https://cdn.petlife.app'),
  RESEND_API_KEY: z.string().default(''),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    console.error('Invalid environment variables:', formatted);
    throw new Error(`Invalid environment variables: ${JSON.stringify(formatted)}`);
  }

  return Object.freeze(result.data);
}

export const env = loadEnv();
```

- [ ] **2.2** Create `petlife-backend/src/plugins/errorHandler.js`

```js
import fp from 'fastify-plugin';

class AppError extends Error {
  constructor(statusCode, code, message, fields = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
  }
}

function errorHandlerPlugin(fastify, _opts, done) {
  fastify.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode || 500;
    const code = error.code || 'INTERNAL_ERROR';
    const message = statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message;

    const response = {
      error: {
        code,
        message,
      },
    };

    if (error.fields) {
      response.error.fields = error.fields;
    }

    if (statusCode === 500) {
      request.log.error(error);
    }

    reply.status(statusCode).send(response);
  });

  done();
}

export default fp(errorHandlerPlugin, { name: 'error-handler' });
export { AppError };
```

- [ ] **2.3** Add `fastify-plugin` dependency to package.json

```bash
cd ~/Documents/petlife/petlife-backend
npm install fastify-plugin
```

- [ ] **2.4** Update `petlife-backend/src/server.js` to register the error handler

```js
import Fastify from 'fastify';
import errorHandler from './plugins/errorHandler.js';

export function buildApp(opts = {}) {
  const app = Fastify({
    logger: opts.logger ?? (process.env.NODE_ENV !== 'test'),
    ...opts,
  });

  app.register(errorHandler);

  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}

async function start() {
  const port = parseInt(process.env.PORT || '3001', 10);
  const host = '0.0.0.0';
  const app = buildApp();

  try {
    await app.listen({ port, host });
    console.log(`PetLife API running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

const isMainModule = process.argv[1] &&
  (process.argv[1] === new URL(import.meta.url).pathname ||
   process.argv[1].endsWith('/src/server.js'));

if (isMainModule) {
  start();
}
```

- [ ] **2.5** Create `petlife-backend/tests/config/env.test.js`

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('env config', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should load with defaults in development', async () => {
    // Re-import to get fresh module
    const { loadEnvFromValues } = await import('../../src/config/env.js');
    const env = loadEnvFromValues({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://localhost:5432/petlife',
      FRONTEND_URL: 'http://localhost:5173',
    });

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3001);
    expect(env.JWT_SECRET).toBe('dev-jwt-secret-change-me');
  });

  it('should throw on invalid DATABASE_URL', () => {
    const { loadEnvFromValues } = require_fresh();
    expect(() => loadEnvFromValues({
      DATABASE_URL: 'not-a-url',
    })).toThrow();
  });

  it('should throw on empty JWT_SECRET when explicitly set too short', () => {
    const { loadEnvFromValues } = require_fresh();
    expect(() => loadEnvFromValues({
      JWT_SECRET: 'short',
      DATABASE_URL: 'postgresql://localhost:5432/petlife',
      FRONTEND_URL: 'http://localhost:5173',
    })).toThrow();
  });
});

function require_fresh() {
  // Use dynamic import trick — but since vitest caches, we inline the logic
  const { z } = require('zod');

  const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().url().default('postgresql://localhost:5432/petlife'),
    JWT_SECRET: z.string().min(10).default('dev-jwt-secret-change-me'),
    JWT_REFRESH_SECRET: z.string().min(10).default('dev-refresh-secret-change-me'),
    R2_ACCOUNT_ID: z.string().default(''),
    R2_ACCESS_KEY_ID: z.string().default(''),
    R2_SECRET_ACCESS_KEY: z.string().default(''),
    R2_BUCKET_NAME: z.string().default('petlife-uploads'),
    R2_PUBLIC_URL: z.string().default('https://cdn.petlife.app'),
    RESEND_API_KEY: z.string().default(''),
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  });

  return {
    loadEnvFromValues(values) {
      const result = envSchema.safeParse(values);
      if (!result.success) {
        throw new Error(`Invalid env: ${JSON.stringify(result.error.flatten().fieldErrors)}`);
      }
      return Object.freeze(result.data);
    },
  };
}
```

- [ ] **2.6** Update `petlife-backend/src/config/env.js` to export a testable function

```js
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().url().default('postgresql://localhost:5432/petlife'),
  JWT_SECRET: z.string().min(10).default('dev-jwt-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().min(10).default('dev-refresh-secret-change-me'),
  R2_ACCOUNT_ID: z.string().default(''),
  R2_ACCESS_KEY_ID: z.string().default(''),
  R2_SECRET_ACCESS_KEY: z.string().default(''),
  R2_BUCKET_NAME: z.string().default('petlife-uploads'),
  R2_PUBLIC_URL: z.string().default('https://cdn.petlife.app'),
  RESEND_API_KEY: z.string().default(''),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

export function loadEnvFromValues(values) {
  const result = envSchema.safeParse(values);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    throw new Error(`Invalid environment variables: ${JSON.stringify(formatted)}`);
  }

  return Object.freeze(result.data);
}

export const env = loadEnvFromValues(process.env);
```

- [ ] **2.7** Create `petlife-backend/tests/plugins/errorHandler.test.js`

```js
import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import errorHandler, { AppError } from '../../src/plugins/errorHandler.js';

describe('errorHandler plugin', () => {
  function buildTestApp() {
    const app = Fastify({ logger: false });
    app.register(errorHandler);
    return app;
  }

  it('should format AppError with custom code and status', async () => {
    const app = buildTestApp();

    app.get('/fail', async () => {
      throw new AppError(400, 'VALIDATION_ERROR', 'Email is required', {
        email: 'Required',
      });
    });

    const res = await app.inject({ method: 'GET', url: '/fail' });

    expect(res.statusCode).toBe(400);

    const body = JSON.parse(res.payload);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('Email is required');
    expect(body.error.fields).toEqual({ email: 'Required' });

    await app.close();
  });

  it('should handle generic Error as 500', async () => {
    const app = buildTestApp();

    app.get('/crash', async () => {
      throw new Error('Something broke');
    });

    const res = await app.inject({ method: 'GET', url: '/crash' });

    expect(res.statusCode).toBe(500);

    const body = JSON.parse(res.payload);
    expect(body.error.code).toBe('INTERNAL_ERROR');

    await app.close();
  });

  it('should return standard JSON format for all errors', async () => {
    const app = buildTestApp();

    app.get('/not-found', async (_req, reply) => {
      reply.status(404);
      throw new AppError(404, 'NOT_FOUND', 'Resource not found');
    });

    const res = await app.inject({ method: 'GET', url: '/not-found' });

    expect(res.statusCode).toBe(404);

    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('error');
    expect(body.error).toHaveProperty('code');
    expect(body.error).toHaveProperty('message');

    await app.close();
  });
});
```

- [ ] **2.8** Run the tests

```bash
cd ~/Documents/petlife/petlife-backend
npx vitest run tests/config/ tests/plugins/
```

Expected output:
```
 ✓ tests/config/env.test.js (3)
 ✓ tests/plugins/errorHandler.test.js (3)

 Test Files  2 passed (2)
 Tests       6 passed (6)
```

- [ ] **2.9** Commit

```bash
cd ~/Documents/petlife/petlife-backend
git add -A
git commit -m "feat(sp1): add Zod env config and error handler plugin

Environment variables are validated with Zod on startup. AppError class
provides structured JSON error responses with code, message, and fields."
```

---

## Task 3: Prisma Schema & Migrations

**Files:**
- `petlife-backend/prisma/schema.prisma`
- `petlife-backend/prisma/seed.js`
- `petlife-backend/tests/setup.js` (updated)

### Steps

- [ ] **3.1** Create `petlife-backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────────

enum Plan {
  FREE
  PREMIUM
}

enum AuthProvider {
  EMAIL
  GOOGLE
  APPLE
}

enum Species {
  DOG
  CAT
}

enum Sex {
  MALE
  FEMALE
}

enum FoodType {
  DRY
  WET
  RAW
  HOMEMADE
  MIXED
}

enum HealthStatus {
  OK
  DUE_SOON
  OVERDUE
}

enum RecordType {
  VACCINE
  DEWORMING
  MEDICATION
  CONSULTATION
  EXAM
  SURGERY
  NOTE
}

// ─── Models ──────────────────────────────────────────────

model User {
  id               String         @id @default(cuid())
  name             String
  email            String         @unique
  passwordHash     String
  phone            String?
  avatarUrl        String?
  plan             Plan           @default(FREE)
  provider         AuthProvider   @default(EMAIL)
  resetToken       String?
  resetTokenExpiry DateTime?
  refreshToken     String?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  deletedAt        DateTime?

  pets             Pet[]
  reminderConfig   ReminderConfig?

  @@map("users")
}

model Pet {
  id          String    @id @default(cuid())
  userId      String
  name        String
  species     Species
  breed       String?
  birthDate   DateTime?
  sex         Sex?
  weight      Float?
  photo       String?
  allergies   String[]
  conditions  String[]
  microchip   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  foodConfig   FoodConfig?
  vaccines     Vaccine[]
  dewormings   Deworming[]
  medications  Medication[]
  consultations Consultation[]
  weightEntries WeightEntry[]
  mealLogs     MealLog[]
  records      Record[]

  @@index([userId])
  @@map("pets")
}

model FoodConfig {
  id           String   @id @default(cuid())
  petId        String   @unique
  brand        String?
  line         String?
  type         FoodType @default(DRY)
  portionGrams Float?
  mealsPerDay  Int      @default(2)
  schedule     String[] @default([])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  pet Pet @relation(fields: [petId], references: [id], onDelete: Cascade)

  @@map("food_configs")
}

model Vaccine {
  id       String    @id @default(cuid())
  petId    String
  name     String
  lastDone DateTime
  nextDue  DateTime?
  clinic   String?
  vet      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  pet Pet @relation(fields: [petId], references: [id], onDelete: Cascade)

  @@index([petId])
  @@map("vaccines")
}

model Deworming {
  id       String    @id @default(cuid())
  petId    String
  name     String
  product  String?
  lastDone DateTime
  nextDue  DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  pet Pet @relation(fields: [petId], references: [id], onDelete: Cascade)

  @@index([petId])
  @@map("dewormings")
}

model Medication {
  id        String    @id @default(cuid())
  petId     String
  name      String
  dose      String?
  frequency String?
  startDate DateTime
  duration  String?
  nextDue   DateTime?
  active    Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  pet Pet @relation(fields: [petId], references: [id], onDelete: Cascade)

  @@index([petId])
  @@map("medications")
}

model Consultation {
  id        String   @id @default(cuid())
  petId     String
  date      DateTime
  type      String?
  clinic    String?
  vet       String?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  pet Pet @relation(fields: [petId], references: [id], onDelete: Cascade)

  @@index([petId])
  @@map("consultations")
}

model WeightEntry {
  id        String   @id @default(cuid())
  petId     String
  date      DateTime
  value     Float
  createdAt DateTime @default(now())

  pet Pet @relation(fields: [petId], references: [id], onDelete: Cascade)

  @@index([petId])
  @@map("weight_entries")
}

model MealLog {
  id        String   @id @default(cuid())
  petId     String
  date      DateTime
  time      String
  given     Boolean  @default(true)
  createdAt DateTime @default(now())

  pet Pet @relation(fields: [petId], references: [id], onDelete: Cascade)

  @@index([petId, date])
  @@map("meal_logs")
}

model Record {
  id          String     @id @default(cuid())
  petId       String
  date        DateTime
  type        RecordType
  title       String
  description String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  pet         Pet          @relation(fields: [petId], references: [id], onDelete: Cascade)
  attachments Attachment[]

  @@index([petId, type])
  @@index([petId, date])
  @@map("records")
}

model Attachment {
  id        String   @id @default(cuid())
  recordId  String
  filename  String
  url       String
  mimeType  String
  size      Int
  createdAt DateTime @default(now())

  record Record @relation(fields: [recordId], references: [id], onDelete: Cascade)

  @@index([recordId])
  @@map("attachments")
}

model ReminderConfig {
  id            String  @id @default(cuid())
  userId        String  @unique
  vaccines      Boolean @default(true)
  medications   Boolean @default(true)
  food          Boolean @default(true)
  consultations Boolean @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("reminder_configs")
}
```

- [ ] **3.2** Run the initial migration

```bash
cd ~/Documents/petlife/petlife-backend
npx prisma migrate dev --name init
```

Expected output:
```
Your database is now in sync with your schema.
✔ Generated Prisma Client
```

- [ ] **3.3** Create `petlife-backend/prisma/seed.js`

```js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Community groups will be used in SP2, define structure now
  // For SP1, we just verify DB connectivity
  const userCount = await prisma.user.count();
  console.log(`Current users: ${userCount}`);

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **3.4** Update `petlife-backend/tests/setup.js` with DB cleanup

```js
import { PrismaClient } from '@prisma/client';
import { beforeEach, afterAll } from 'vitest';

const prisma = new PrismaClient();

beforeEach(async () => {
  // Delete in order respecting foreign keys
  await prisma.attachment.deleteMany();
  await prisma.record.deleteMany();
  await prisma.mealLog.deleteMany();
  await prisma.weightEntry.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.deworming.deleteMany();
  await prisma.vaccine.deleteMany();
  await prisma.foodConfig.deleteMany();
  await prisma.reminderConfig.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
```

- [ ] **3.5** Create `petlife-backend/src/lib/prisma.js` (shared Prisma instance)

```js
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}
```

- [ ] **3.6** Verify migration works by running seed

```bash
cd ~/Documents/petlife/petlife-backend
node prisma/seed.js
```

Expected output:
```
Seeding database...
Current users: 0
Seed complete.
```

- [ ] **3.7** Commit

```bash
cd ~/Documents/petlife/petlife-backend
git add -A
git commit -m "feat(sp1): Prisma schema with all models and initial migration

Define User, Pet, FoodConfig, Vaccine, Deworming, Medication,
Consultation, WeightEntry, MealLog, Record, Attachment, ReminderConfig.
Test setup cleans DB between runs."
```

---

## Task 4: Auth Utilities

**Files:**
- `petlife-backend/src/utils/password.js`
- `petlife-backend/src/utils/jwt.js`
- `petlife-backend/tests/utils/password.test.js`
- `petlife-backend/tests/utils/jwt.test.js`

### Steps

- [ ] **4.1** Create `petlife-backend/src/utils/password.js`

```js
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **4.2** Create `petlife-backend/src/utils/jwt.js`

```js
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

export function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}
```

- [ ] **4.3** Create `petlife-backend/tests/utils/password.test.js`

```js
import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../../src/utils/password.js';

describe('password utils', () => {
  it('should hash a password and verify it correctly', async () => {
    const plain = 'MySecureP@ss123';
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(hash).toMatch(/^\$2[aby]\$/);

    const isValid = await comparePassword(plain, hash);
    expect(isValid).toBe(true);
  });

  it('should reject wrong password', async () => {
    const hash = await hashPassword('correctPassword');
    const isValid = await comparePassword('wrongPassword', hash);
    expect(isValid).toBe(false);
  });

  it('should produce different hashes for same input', async () => {
    const plain = 'samePassword123';
    const hash1 = await hashPassword(plain);
    const hash2 = await hashPassword(plain);
    expect(hash1).not.toBe(hash2);
  });
});
```

- [ ] **4.4** Create `petlife-backend/tests/utils/jwt.test.js`

```js
import { describe, it, expect } from 'vitest';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../src/utils/jwt.js';
import jwt from 'jsonwebtoken';

describe('JWT utils', () => {
  const payload = { id: 'user-123', email: 'test@example.com', plan: 'FREE' };

  it('should sign and verify an access token', () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);

    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.plan).toBe(payload.plan);
    expect(decoded.exp).toBeDefined();
  });

  it('should sign and verify a refresh token', () => {
    const token = signRefreshToken(payload);
    const decoded = verifyRefreshToken(token);

    expect(decoded.id).toBe(payload.id);
    expect(decoded.email).toBe(payload.email);
  });

  it('should reject expired access token', () => {
    const secret = process.env.JWT_SECRET || 'dev-jwt-secret-change-me';
    const token = jwt.sign(payload, secret, { expiresIn: '0s' });

    expect(() => verifyAccessToken(token)).toThrow();
  });

  it('should reject token signed with wrong secret', () => {
    const token = jwt.sign(payload, 'wrong-secret-key-1234567890');

    expect(() => verifyAccessToken(token)).toThrow();
  });

  it('should reject access token when verified as refresh', () => {
    const accessToken = signAccessToken(payload);

    // Access and refresh use different secrets, so cross-verify should fail
    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });

  it('should reject malformed token', () => {
    expect(() => verifyAccessToken('not.a.token')).toThrow();
    expect(() => verifyRefreshToken('garbage')).toThrow();
  });
});
```

- [ ] **4.5** Run the tests

```bash
cd ~/Documents/petlife/petlife-backend
npx vitest run tests/utils/
```

Expected output:
```
 ✓ tests/utils/password.test.js (3)
 ✓ tests/utils/jwt.test.js (6)

 Test Files  2 passed (2)
 Tests       9 passed (9)
```

- [ ] **4.6** Commit

```bash
cd ~/Documents/petlife/petlife-backend
git add -A
git commit -m "feat(sp1): auth utilities — bcrypt password and JWT token helpers

hashPassword/comparePassword with salt 12. signAccessToken (15m) and
signRefreshToken (7d) with separate secrets. Full test coverage."
```

---

## Task 5: Auth Plugin & CORS

**Files:**
- `petlife-backend/src/plugins/auth.js`
- `petlife-backend/src/plugins/cors.js`
- `petlife-backend/src/plugins/rateLimit.js`
- `petlife-backend/tests/plugins/auth.test.js`

### Steps

- [ ] **5.1** Create `petlife-backend/src/plugins/auth.js`

```js
import fp from 'fastify-plugin';
import { verifyAccessToken } from '../utils/jwt.js';

function authPlugin(fastify, _opts, done) {
  fastify.decorate('authenticate', async (request, reply) => {
    // Skip auth for public routes
    if (request.url.startsWith('/auth/') || request.url === '/health') {
      return;
    }

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      });
      return;
    }

    const token = authHeader.slice(7);

    try {
      const decoded = verifyAccessToken(token);
      request.user = {
        id: decoded.id,
        email: decoded.email,
        plan: decoded.plan,
      };
    } catch (err) {
      reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
    }
  });

  // Add a hook that runs authenticate on all routes by default
  fastify.addHook('onRequest', async (request, reply) => {
    if (request.url.startsWith('/auth/') || request.url === '/health') {
      return;
    }
    await fastify.authenticate(request, reply);
  });

  done();
}

export default fp(authPlugin, { name: 'auth' });
```

- [ ] **5.2** Create `petlife-backend/src/plugins/cors.js`

```js
import fp from 'fastify-plugin';
import cors from '@fastify/cors';

function corsPlugin(fastify, _opts, done) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  fastify.register(cors, {
    origin: [frontendUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  done();
}

export default fp(corsPlugin, { name: 'cors' });
```

- [ ] **5.3** Create `petlife-backend/src/plugins/rateLimit.js`

```js
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';

function rateLimitPlugin(fastify, _opts, done) {
  fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => request.ip,
    allowList: [],
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    errorResponseBuilder: () => ({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
      },
    }),
  });

  done();
}

export default fp(rateLimitPlugin, { name: 'rate-limit' });
```

- [ ] **5.4** Update `petlife-backend/src/server.js` to register all plugins

```js
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import errorHandler from './plugins/errorHandler.js';
import authPlugin from './plugins/auth.js';
import corsPlugin from './plugins/cors.js';
import rateLimitPlugin from './plugins/rateLimit.js';

export function buildApp(opts = {}) {
  const app = Fastify({
    logger: opts.logger ?? (process.env.NODE_ENV !== 'test'),
    ...opts,
  });

  // Plugins
  app.register(errorHandler);
  app.register(corsPlugin);
  app.register(cookie, {
    secret: process.env.JWT_REFRESH_SECRET || 'dev-cookie-secret',
    parseOptions: {},
  });

  // Rate limiting (skip in test by default)
  if (process.env.NODE_ENV !== 'test') {
    app.register(rateLimitPlugin);
  }

  // Auth
  app.register(authPlugin);

  // Health check (public route)
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}

async function start() {
  const port = parseInt(process.env.PORT || '3001', 10);
  const host = '0.0.0.0';
  const app = buildApp();

  try {
    await app.listen({ port, host });
    console.log(`PetLife API running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

const isMainModule = process.argv[1] &&
  (process.argv[1] === new URL(import.meta.url).pathname ||
   process.argv[1].endsWith('/src/server.js'));

if (isMainModule) {
  start();
}
```

- [ ] **5.5** Create `petlife-backend/tests/plugins/auth.test.js`

```js
import { describe, it, expect } from 'vitest';
import { buildApp } from '../../src/server.js';
import { signAccessToken } from '../../src/utils/jwt.js';

describe('auth plugin', () => {
  function createApp() {
    const app = buildApp({ logger: false });

    // Add a protected test route
    app.get('/protected', async (request) => {
      return { user: request.user };
    });

    return app;
  }

  it('should allow access with valid token', async () => {
    const app = createApp();

    const token = signAccessToken({
      id: 'user-1',
      email: 'test@example.com',
      plan: 'FREE',
    });

    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.payload);
    expect(body.user.id).toBe('user-1');
    expect(body.user.email).toBe('test@example.com');
    expect(body.user.plan).toBe('FREE');

    await app.close();
  });

  it('should return 401 when no token is provided', async () => {
    const app = createApp();

    const res = await app.inject({
      method: 'GET',
      url: '/protected',
    });

    expect(res.statusCode).toBe(401);

    const body = JSON.parse(res.payload);
    expect(body.error.code).toBe('UNAUTHORIZED');

    await app.close();
  });

  it('should return 401 for invalid token', async () => {
    const app = createApp();

    const res = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: {
        authorization: 'Bearer invalid-token-here',
      },
    });

    expect(res.statusCode).toBe(401);

    const body = JSON.parse(res.payload);
    expect(body.error.code).toBe('UNAUTHORIZED');

    await app.close();
  });

  it('should skip auth for /health', async () => {
    const app = createApp();

    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.statusCode).toBe(200);

    await app.close();
  });

  it('should skip auth for /auth/* routes', async () => {
    const app = buildApp({ logger: false });

    // Register a fake auth route
    app.post('/auth/test', async () => {
      return { ok: true };
    });

    const res = await app.inject({
      method: 'POST',
      url: '/auth/test',
    });

    expect(res.statusCode).toBe(200);

    await app.close();
  });
});
```

- [ ] **5.6** Run the tests

```bash
cd ~/Documents/petlife/petlife-backend
npx vitest run tests/plugins/auth.test.js
```

Expected output:
```
 ✓ tests/plugins/auth.test.js (5)
   ✓ auth plugin (5)
     ✓ should allow access with valid token
     ✓ should return 401 when no token is provided
     ✓ should return 401 for invalid token
     ✓ should skip auth for /health
     ✓ should skip auth for /auth/* routes

 Test Files  1 passed (1)
 Tests       5 passed (5)
```

- [ ] **5.7** Commit

```bash
cd ~/Documents/petlife/petlife-backend
git add -A
git commit -m "feat(sp1): auth plugin, CORS, and rate limiting

JWT Bearer auth decorator with automatic route protection. CORS
whitelists FRONTEND_URL. Rate limiting at 100 req/min global."
```

---

## Task 6: Auth Routes (Register, Login, Refresh, Logout)

**Files:**
- `petlife-backend/src/schemas/auth.js`
- `petlife-backend/src/services/auth.js`
- `petlife-backend/src/routes/auth.js`
- `petlife-backend/tests/routes/auth.test.js`
- `petlife-backend/tests/factories/user.js`

### Steps

- [ ] **6.1** Create `petlife-backend/src/schemas/auth.js`

```js
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({}).optional();

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});
```

- [ ] **6.2** Create `petlife-backend/src/services/auth.js`

```js
import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { AppError } from '../plugins/errorHandler.js';
import crypto from 'node:crypto';

export async function createUser({ name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
    },
  });

  const tokens = generateTokens(user);

  // Store refresh token hash
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return { user, ...tokens };
}

export async function authenticateUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      passwordHash: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const { passwordHash, deletedAt, ...userData } = user;
  const tokens = generateTokens(userData);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return { user: userData, ...tokens };
}

export async function refreshTokens(currentRefreshToken) {
  if (!currentRefreshToken) {
    throw new AppError(401, 'UNAUTHORIZED', 'No refresh token provided');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(currentRefreshToken);
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      refreshToken: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not found');
  }

  // Verify token matches stored token (rotation)
  if (user.refreshToken !== currentRefreshToken) {
    // Possible token reuse attack — invalidate all tokens
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: null },
    });
    throw new AppError(401, 'UNAUTHORIZED', 'Token has been revoked');
  }

  const { refreshToken: _, deletedAt: __, ...userData } = user;
  const tokens = generateTokens(userData);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: tokens.refreshToken },
  });

  return { user: userData, ...tokens };
}

export async function logoutUser(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
}

export async function generateResetToken(email) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success (security: don't reveal if email exists)
  if (!user) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: tokenHash,
      resetTokenExpiry: expiry,
    },
  });

  return { token, userId: user.id };
}

export async function resetPassword({ token, newPassword }) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      resetToken: tokenHash,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError(400, 'INVALID_TOKEN', 'Reset token is invalid or has expired');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
      refreshToken: null, // Invalidate all sessions
    },
  });
}

function generateTokens(user) {
  const payload = { id: user.id, email: user.email, plan: user.plan };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return { accessToken, refreshToken };
}
```

- [ ] **6.3** Create `petlife-backend/src/routes/auth.js`

```js
import { registerSchema, loginSchema } from '../schemas/auth.js';
import {
  createUser,
  authenticateUser,
  refreshTokens,
  logoutUser,
} from '../services/auth.js';
import { AppError } from '../plugins/errorHandler.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

export default async function authRoutes(fastify) {
  // POST /auth/register
  fastify.post('/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const { user, accessToken, refreshToken } = await createUser(parsed.data);

    reply.setCookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return reply.status(201).send({
      data: {
        accessToken,
        user,
      },
    });
  });

  // POST /auth/login
  fastify.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const { user, accessToken, refreshToken } = await authenticateUser(parsed.data);

    reply.setCookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return reply.status(200).send({
      data: {
        accessToken,
        user,
      },
    });
  });

  // POST /auth/refresh
  fastify.post('/auth/refresh', async (request, reply) => {
    const currentToken = request.cookies.refreshToken;

    const { user, accessToken, refreshToken } = await refreshTokens(currentToken);

    reply.setCookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return reply.status(200).send({
      data: {
        accessToken,
        user,
      },
    });
  });

  // DELETE /auth/logout
  fastify.delete('/auth/logout', async (request, reply) => {
    // Try to get user from token if available
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const { verifyAccessToken } = await import('../utils/jwt.js');
        const decoded = verifyAccessToken(authHeader.slice(7));
        await logoutUser(decoded.id);
      } catch {
        // Ignore — token may already be expired
      }
    }

    reply.clearCookie('refreshToken', { path: '/' });

    return reply.status(200).send({
      data: { message: 'Logged out successfully' },
    });
  });
}
```

- [ ] **6.4** Update `petlife-backend/src/server.js` to register auth routes

```js
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import errorHandler from './plugins/errorHandler.js';
import authPlugin from './plugins/auth.js';
import corsPlugin from './plugins/cors.js';
import rateLimitPlugin from './plugins/rateLimit.js';
import authRoutes from './routes/auth.js';

export function buildApp(opts = {}) {
  const app = Fastify({
    logger: opts.logger ?? (process.env.NODE_ENV !== 'test'),
    ...opts,
  });

  // Plugins
  app.register(errorHandler);
  app.register(corsPlugin);
  app.register(cookie, {
    secret: process.env.JWT_REFRESH_SECRET || 'dev-cookie-secret',
    parseOptions: {},
  });

  // Rate limiting (skip in test by default)
  if (process.env.NODE_ENV !== 'test') {
    app.register(rateLimitPlugin);
  }

  // Auth
  app.register(authPlugin);

  // Routes
  app.register(authRoutes);

  // Health check (public route)
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}

async function start() {
  const port = parseInt(process.env.PORT || '3001', 10);
  const host = '0.0.0.0';
  const app = buildApp();

  try {
    await app.listen({ port, host });
    console.log(`PetLife API running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

const isMainModule = process.argv[1] &&
  (process.argv[1] === new URL(import.meta.url).pathname ||
   process.argv[1].endsWith('/src/server.js'));

if (isMainModule) {
  start();
}
```

- [ ] **6.5** Create `petlife-backend/tests/factories/user.js`

```js
import { prisma } from '../setup.js';
import { hashPassword } from '../../src/utils/password.js';

let userCounter = 0;

export async function createTestUser(overrides = {}) {
  userCounter++;
  const password = overrides.password || 'TestPass123';
  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name: overrides.name || `Test User ${userCounter}`,
      email: overrides.email || `test${userCounter}@example.com`,
      passwordHash,
      plan: overrides.plan || 'FREE',
      ...overrides,
      password: undefined, // remove plain password from data
    },
  });

  return { ...user, plainPassword: password };
}
```

- [ ] **6.6** Create `petlife-backend/tests/routes/auth.test.js`

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../../src/server.js';
import { prisma } from '../setup.js';
import { createTestUser } from '../factories/user.js';

describe('Auth Routes', () => {
  let app;

  beforeEach(async () => {
    app = buildApp({ logger: false });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Maria Silva',
          email: 'maria@example.com',
          password: 'SecurePass123',
        },
      });

      expect(res.statusCode).toBe(201);

      const body = JSON.parse(res.payload);
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.user.name).toBe('Maria Silva');
      expect(body.data.user.email).toBe('maria@example.com');
      expect(body.data.user.plan).toBe('FREE');
      expect(body.data.user.passwordHash).toBeUndefined();

      // Check cookie was set
      const cookies = res.cookies;
      const refreshCookie = cookies.find(c => c.name === 'refreshToken');
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie.httpOnly).toBe(true);
    });

    it('should return 409 when email already exists', async () => {
      await createTestUser({ email: 'taken@example.com' });

      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Another User',
          email: 'taken@example.com',
          password: 'SecurePass123',
        },
      });

      expect(res.statusCode).toBe(409);

      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('EMAIL_EXISTS');
    });

    it('should return 400 for invalid input', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: '',
          email: 'not-email',
          password: 'short',
        },
      });

      expect(res.statusCode).toBe(400);

      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.fields).toBeDefined();
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const user = await createTestUser({
        email: 'login@example.com',
        password: 'MyPassword123',
      });

      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'login@example.com',
          password: 'MyPassword123',
        },
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.user.email).toBe('login@example.com');
    });

    it('should return 401 for wrong password', async () => {
      await createTestUser({
        email: 'login2@example.com',
        password: 'CorrectPass123',
      });

      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'login2@example.com',
          password: 'WrongPassword',
        },
      });

      expect(res.statusCode).toBe(401);

      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'nobody@example.com',
          password: 'SomePassword123',
        },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should rotate tokens when valid refresh cookie is sent', async () => {
      // First register to get a refresh token
      const registerRes = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Refresh User',
          email: 'refresh@example.com',
          password: 'SecurePass123',
        },
      });

      const refreshCookie = registerRes.cookies.find(c => c.name === 'refreshToken');

      const res = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        cookies: {
          refreshToken: refreshCookie.value,
        },
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data.accessToken).toBeDefined();

      // New refresh cookie should be set
      const newRefreshCookie = res.cookies.find(c => c.name === 'refreshToken');
      expect(newRefreshCookie).toBeDefined();
      expect(newRefreshCookie.value).not.toBe(refreshCookie.value);
    });

    it('should return 401 when no refresh cookie exists', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /auth/logout', () => {
    it('should clear refresh cookie', async () => {
      const registerRes = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          name: 'Logout User',
          email: 'logout@example.com',
          password: 'SecurePass123',
        },
      });

      const body = JSON.parse(registerRes.payload);

      const res = await app.inject({
        method: 'DELETE',
        url: '/auth/logout',
        headers: {
          authorization: `Bearer ${body.data.accessToken}`,
        },
      });

      expect(res.statusCode).toBe(200);

      // Verify refresh token cleared in DB
      const user = await prisma.user.findUnique({
        where: { email: 'logout@example.com' },
      });
      expect(user.refreshToken).toBeNull();
    });
  });
});
```

- [ ] **6.7** Run the tests

```bash
cd ~/Documents/petlife/petlife-backend
npx vitest run tests/routes/auth.test.js
```

Expected output:
```
 ✓ tests/routes/auth.test.js (8)
   ✓ Auth Routes > POST /auth/register (3)
   ✓ Auth Routes > POST /auth/login (3)
   ✓ Auth Routes > POST /auth/refresh (2)
   ✓ Auth Routes > DELETE /auth/logout (1)

 Test Files  1 passed (1)
 Tests       8 passed (8)
```

- [ ] **6.8** Commit

```bash
cd ~/Documents/petlife/petlife-backend
git add -A
git commit -m "feat(sp1): auth routes — register, login, refresh, logout

Full auth flow with JWT access tokens (15m) and refresh tokens (7d)
in httpOnly cookies. Token rotation on refresh. Zod validation."
```

---

## Task 7: Auth Routes (Forgot + Reset Password)

**Files:**
- `petlife-backend/src/utils/email.js`
- `petlife-backend/tests/routes/auth-reset.test.js`

### Steps

- [ ] **7.1** Create `petlife-backend/src/utils/email.js`

```js
import { Resend } from 'resend';

let resendClient = null;

function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      resendClient = new Resend(apiKey);
    }
  }
  return resendClient;
}

export async function sendResetEmail({ to, resetUrl }) {
  const client = getResendClient();

  if (!client) {
    console.log(`[EMAIL MOCK] Reset email to ${to}: ${resetUrl}`);
    return { id: 'mock-email-id' };
  }

  const { data, error } = await client.emails.send({
    from: 'PetLife <noreply@petlife.app>',
    to: [to],
    subject: 'Redefinir sua senha — PetLife',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Redefinir Senha</h2>
        <p>Voce solicitou a redefinicao da sua senha no PetLife.</p>
        <p>Clique no link abaixo para criar uma nova senha:</p>
        <a href="${resetUrl}"
           style="display: inline-block; padding: 12px 24px; background: #7C3AED; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">
          Redefinir Senha
        </a>
        <p style="color: #666; font-size: 14px;">
          Este link expira em 1 hora. Se voce nao solicitou esta alteracao, ignore este email.
        </p>
      </div>
    `,
  });

  if (error) {
    console.error('Failed to send reset email:', error);
    throw new Error('Failed to send email');
  }

  return data;
}

// For testing: allow injecting a mock
export function setResendClient(client) {
  resendClient = client;
}
```

- [ ] **7.2** Extend `petlife-backend/src/routes/auth.js` with forgot and reset routes

```js
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.js';
import {
  createUser,
  authenticateUser,
  refreshTokens,
  logoutUser,
  generateResetToken,
  resetPassword,
} from '../services/auth.js';
import { sendResetEmail } from '../utils/email.js';
import { AppError } from '../plugins/errorHandler.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

export default async function authRoutes(fastify) {
  // POST /auth/register
  fastify.post('/auth/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const { user, accessToken, refreshToken } = await createUser(parsed.data);

    reply.setCookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return reply.status(201).send({
      data: {
        accessToken,
        user,
      },
    });
  });

  // POST /auth/login
  fastify.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const { user, accessToken, refreshToken } = await authenticateUser(parsed.data);

    reply.setCookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return reply.status(200).send({
      data: {
        accessToken,
        user,
      },
    });
  });

  // POST /auth/refresh
  fastify.post('/auth/refresh', async (request, reply) => {
    const currentToken = request.cookies.refreshToken;

    const { user, accessToken, refreshToken } = await refreshTokens(currentToken);

    reply.setCookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    return reply.status(200).send({
      data: {
        accessToken,
        user,
      },
    });
  });

  // DELETE /auth/logout
  fastify.delete('/auth/logout', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const { verifyAccessToken } = await import('../utils/jwt.js');
        const decoded = verifyAccessToken(authHeader.slice(7));
        await logoutUser(decoded.id);
      } catch {
        // Ignore — token may already be expired
      }
    }

    reply.clearCookie('refreshToken', { path: '/' });

    return reply.status(200).send({
      data: { message: 'Logged out successfully' },
    });
  });

  // POST /auth/forgot
  fastify.post('/auth/forgot', async (request, reply) => {
    const parsed = forgotPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const result = await generateResetToken(parsed.data.email);

    if (result) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/reset?token=${result.token}`;

      try {
        await sendResetEmail({ to: parsed.data.email, resetUrl });
      } catch (err) {
        // Log but don't fail — user doesn't need to know
        console.error('Failed to send reset email:', err);
      }
    }

    // Always return 200 for security (don't reveal if email exists)
    return reply.status(200).send({
      data: { message: 'If an account with that email exists, a reset link has been sent.' },
    });
  });

  // POST /auth/reset
  fastify.post('/auth/reset', async (request, reply) => {
    const parsed = resetPasswordSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    await resetPassword(parsed.data);

    return reply.status(200).send({
      data: { message: 'Password has been reset successfully.' },
    });
  });
}
```

- [ ] **7.3** Create `petlife-backend/tests/routes/auth-reset.test.js`

```js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildApp } from '../../src/server.js';
import { prisma } from '../setup.js';
import { createTestUser } from '../factories/user.js';
import crypto from 'node:crypto';

// Mock the email module
vi.mock('../../src/utils/email.js', () => ({
  sendResetEmail: vi.fn().mockResolvedValue({ id: 'mock-id' }),
  setResendClient: vi.fn(),
}));

describe('Auth Reset Routes', () => {
  let app;

  beforeEach(async () => {
    app = buildApp({ logger: false });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/forgot', () => {
    it('should return 200 for existing email', async () => {
      await createTestUser({ email: 'forgot@example.com' });

      const res = await app.inject({
        method: 'POST',
        url: '/auth/forgot',
        payload: { email: 'forgot@example.com' },
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data.message).toContain('reset link');
    });

    it('should return 200 for non-existent email (security)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/forgot',
        payload: { email: 'nobody@example.com' },
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data.message).toContain('reset link');
    });

    it('should store a hashed reset token in the database', async () => {
      await createTestUser({ email: 'tokencheck@example.com' });

      await app.inject({
        method: 'POST',
        url: '/auth/forgot',
        payload: { email: 'tokencheck@example.com' },
      });

      const user = await prisma.user.findUnique({
        where: { email: 'tokencheck@example.com' },
      });

      expect(user.resetToken).toBeDefined();
      expect(user.resetToken).not.toBeNull();
      expect(user.resetTokenExpiry).toBeDefined();
      expect(new Date(user.resetTokenExpiry).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('POST /auth/reset', () => {
    it('should reset password with valid token', async () => {
      const user = await createTestUser({ email: 'reset@example.com' });

      // Manually create a reset token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: tokenHash,
          resetTokenExpiry: new Date(Date.now() + 3600000),
        },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/auth/reset',
        payload: {
          token,
          newPassword: 'NewSecurePass456',
        },
      });

      expect(res.statusCode).toBe(200);

      // Verify can login with new password
      const loginRes = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'reset@example.com',
          password: 'NewSecurePass456',
        },
      });

      expect(loginRes.statusCode).toBe(200);
    });

    it('should return 400 for expired token', async () => {
      const user = await createTestUser({ email: 'expired@example.com' });

      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: tokenHash,
          resetTokenExpiry: new Date(Date.now() - 1000), // expired
        },
      });

      const res = await app.inject({
        method: 'POST',
        url: '/auth/reset',
        payload: {
          token,
          newPassword: 'NewPassword123',
        },
      });

      expect(res.statusCode).toBe(400);

      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('INVALID_TOKEN');
    });

    it('should return 400 for invalid token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/reset',
        payload: {
          token: 'totally-invalid-token',
          newPassword: 'NewPassword123',
        },
      });

      expect(res.statusCode).toBe(400);

      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('INVALID_TOKEN');
    });
  });
});
```

- [ ] **7.4** Run the tests

```bash
cd ~/Documents/petlife/petlife-backend
npx vitest run tests/routes/auth-reset.test.js
```

Expected output:
```
 ✓ tests/routes/auth-reset.test.js (6)
   ✓ Auth Reset Routes > POST /auth/forgot (3)
   ✓ Auth Reset Routes > POST /auth/reset (3)

 Test Files  1 passed (1)
 Tests       6 passed (6)
```

- [ ] **7.5** Commit

```bash
cd ~/Documents/petlife/petlife-backend
git add -A
git commit -m "feat(sp1): forgot and reset password flow

Forgot password generates hashed token (1h expiry) and sends email
via Resend. Reset validates token and updates password. Always returns
200 on forgot for security."
```

---

## Task 8: User Profile Routes

**Files:**
- `petlife-backend/src/schemas/me.js`
- `petlife-backend/src/routes/me.js`
- `petlife-backend/src/plugins/planGate.js`
- `petlife-backend/tests/routes/me.test.js`

### Steps

- [ ] **8.1** Create `petlife-backend/src/schemas/me.js`

```js
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});
```

- [ ] **8.2** Create `petlife-backend/src/plugins/planGate.js`

```js
import { AppError } from './errorHandler.js';

/**
 * Middleware factory that checks if the user's plan allows a feature.
 * Usage: { preHandler: planGate('pdf_export') }
 */
export function planGate(feature) {
  const premiumFeatures = {
    pdf_export: true,
    unlimited_pets: true,
    full_weight_history: true,
    unlimited_attachments: true,
    food_scanner: true,
    all_push_reminders: true,
    full_social_card: true,
  };

  return async (request, reply) => {
    if (!premiumFeatures[feature]) {
      // Feature not gated — allow
      return;
    }

    if (request.user.plan === 'PREMIUM') {
      return;
    }

    throw new AppError(403, 'PLAN_REQUIRED', `This feature requires a Premium plan`, {
      feature,
      currentPlan: request.user.plan,
      requiredPlan: 'PREMIUM',
    });
  };
}
```

- [ ] **8.3** Create `petlife-backend/src/routes/me.js`

```js
import { prisma } from '../lib/prisma.js';
import { updateProfileSchema } from '../schemas/me.js';
import { AppError } from '../plugins/errorHandler.js';

export default async function meRoutes(fastify) {
  // GET /me
  fastify.get('/me', async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        plan: true,
        provider: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    return { data: user };
  });

  // PATCH /me
  fastify.patch('/me', async (request) => {
    const parsed = updateProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const user = await prisma.user.update({
      where: { id: request.user.id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        plan: true,
        provider: true,
        createdAt: true,
      },
    });

    return { data: user };
  });

  // DELETE /me (soft delete)
  fastify.delete('/me', async (request, reply) => {
    await prisma.user.update({
      where: { id: request.user.id },
      data: { deletedAt: new Date() },
    });

    reply.clearCookie('refreshToken', { path: '/' });

    return { data: { message: 'Account deactivated successfully' } };
  });
}
```

- [ ] **8.4** Update `petlife-backend/src/server.js` to register me routes

```js
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import errorHandler from './plugins/errorHandler.js';
import authPlugin from './plugins/auth.js';
import corsPlugin from './plugins/cors.js';
import rateLimitPlugin from './plugins/rateLimit.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';

export function buildApp(opts = {}) {
  const app = Fastify({
    logger: opts.logger ?? (process.env.NODE_ENV !== 'test'),
    ...opts,
  });

  // Plugins
  app.register(errorHandler);
  app.register(corsPlugin);
  app.register(cookie, {
    secret: process.env.JWT_REFRESH_SECRET || 'dev-cookie-secret',
    parseOptions: {},
  });

  if (process.env.NODE_ENV !== 'test') {
    app.register(rateLimitPlugin);
  }

  app.register(authPlugin);

  // Routes
  app.register(authRoutes);
  app.register(meRoutes);

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}

async function start() {
  const port = parseInt(process.env.PORT || '3001', 10);
  const host = '0.0.0.0';
  const app = buildApp();

  try {
    await app.listen({ port, host });
    console.log(`PetLife API running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

const isMainModule = process.argv[1] &&
  (process.argv[1] === new URL(import.meta.url).pathname ||
   process.argv[1].endsWith('/src/server.js'));

if (isMainModule) {
  start();
}
```

- [ ] **8.5** Create `petlife-backend/tests/routes/me.test.js`

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/server.js';
import { prisma } from '../setup.js';
import { createTestUser } from '../factories/user.js';
import { signAccessToken } from '../../src/utils/jwt.js';

describe('Me Routes', () => {
  let app;

  beforeEach(async () => {
    app = buildApp({ logger: false });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  function authHeader(user) {
    const token = signAccessToken({ id: user.id, email: user.email, plan: user.plan });
    return { authorization: `Bearer ${token}` };
  }

  describe('GET /me', () => {
    it('should return user profile', async () => {
      const user = await createTestUser({ name: 'Carlos', email: 'carlos@example.com' });

      const res = await app.inject({
        method: 'GET',
        url: '/me',
        headers: authHeader(user),
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data.name).toBe('Carlos');
      expect(body.data.email).toBe('carlos@example.com');
      expect(body.data.plan).toBe('FREE');
      expect(body.data.passwordHash).toBeUndefined();
    });

    it('should return 401 without auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/me',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('PATCH /me', () => {
    it('should update user profile', async () => {
      const user = await createTestUser({ email: 'update@example.com' });

      const res = await app.inject({
        method: 'PATCH',
        url: '/me',
        headers: authHeader(user),
        payload: {
          name: 'Updated Name',
          phone: '+55 11 99999-9999',
        },
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data.name).toBe('Updated Name');
      expect(body.data.phone).toBe('+55 11 99999-9999');
    });

    it('should return 400 for invalid data', async () => {
      const user = await createTestUser({ email: 'invalid@example.com' });

      const res = await app.inject({
        method: 'PATCH',
        url: '/me',
        headers: authHeader(user),
        payload: {
          name: '',
        },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /me', () => {
    it('should soft delete the user account', async () => {
      const user = await createTestUser({ email: 'delete@example.com' });

      const res = await app.inject({
        method: 'DELETE',
        url: '/me',
        headers: authHeader(user),
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data.message).toContain('deactivated');

      // Verify soft delete
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(dbUser.deletedAt).not.toBeNull();
    });
  });
});
```

- [ ] **8.6** Run the tests

```bash
cd ~/Documents/petlife/petlife-backend
npx vitest run tests/routes/me.test.js
```

Expected output:
```
 ✓ tests/routes/me.test.js (5)
   ✓ Me Routes > GET /me (2)
   ✓ Me Routes > PATCH /me (2)
   ✓ Me Routes > DELETE /me (1)

 Test Files  1 passed (1)
 Tests       5 passed (5)
```

- [ ] **8.7** Commit

```bash
cd ~/Documents/petlife/petlife-backend
git add -A
git commit -m "feat(sp1): user profile routes and planGate middleware

GET/PATCH/DELETE /me for tutor profile management. Soft delete on
account removal. planGate middleware skeleton for feature gating."
```

---

## Task 9: Pets CRUD Routes

**Files:**
- `petlife-backend/src/schemas/pets.js`
- `petlife-backend/src/routes/pets.js`
- `petlife-backend/src/plugins/petOwnership.js`
- `petlife-backend/tests/factories/pet.js`
- `petlife-backend/tests/routes/pets.test.js`

### Steps

- [ ] **9.1** Create `petlife-backend/src/schemas/pets.js`

```js
import { z } from 'zod';

export const createPetSchema = z.object({
  name: z.string().min(1, 'Pet name is required').max(100),
  species: z.enum(['DOG', 'CAT']),
  breed: z.string().max(100).optional().nullable(),
  birthDate: z.string().datetime().optional().nullable()
    .refine((val) => {
      if (!val) return true;
      return new Date(val) <= new Date();
    }, 'Birth date cannot be in the future'),
  sex: z.enum(['MALE', 'FEMALE']).optional().nullable(),
  weight: z.number().positive('Weight must be greater than 0').optional().nullable(),
  allergies: z.array(z.string()).optional().default([]),
  conditions: z.array(z.string()).optional().default([]),
  microchip: z.string().max(50).optional().nullable(),
});

export const updatePetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  species: z.enum(['DOG', 'CAT']).optional(),
  breed: z.string().max(100).optional().nullable(),
  birthDate: z.string().datetime().optional().nullable()
    .refine((val) => {
      if (!val) return true;
      return new Date(val) <= new Date();
    }, 'Birth date cannot be in the future'),
  sex: z.enum(['MALE', 'FEMALE']).optional().nullable(),
  weight: z.number().positive('Weight must be greater than 0').optional().nullable(),
  allergies: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  microchip: z.string().max(50).optional().nullable(),
});
```

- [ ] **9.2** Create `petlife-backend/src/plugins/petOwnership.js`

```js
import { prisma } from '../lib/prisma.js';
import { AppError } from './errorHandler.js';

/**
 * Fastify preHandler that verifies the pet belongs to req.user.
 * Expects params.petId to be set.
 * Injects request.pet with the pet data.
 */
export async function verifyPetOwnership(request, reply) {
  const { petId } = request.params;

  if (!petId) {
    throw new AppError(400, 'BAD_REQUEST', 'Pet ID is required');
  }

  const pet = await prisma.pet.findUnique({
    where: { id: petId },
  });

  if (!pet || pet.deletedAt) {
    throw new AppError(404, 'NOT_FOUND', 'Pet not found');
  }

  if (pet.userId !== request.user.id) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have access to this pet');
  }

  request.pet = pet;
}
```

- [ ] **9.3** Create `petlife-backend/src/routes/pets.js`

```js
import { prisma } from '../lib/prisma.js';
import { createPetSchema, updatePetSchema } from '../schemas/pets.js';
import { verifyPetOwnership } from '../plugins/petOwnership.js';
import { AppError } from '../plugins/errorHandler.js';

const MAX_FREE_PETS = 2;

export default async function petsRoutes(fastify) {
  // GET /pets — list user's pets
  fastify.get('/pets', async (request) => {
    const pets = await prisma.pet.findMany({
      where: {
        userId: request.user.id,
        deletedAt: null,
      },
      include: {
        foodConfig: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: pets };
  });

  // POST /pets — create pet
  fastify.post('/pets', async (request, reply) => {
    const parsed = createPetSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    // Freemium limit: max 2 pets on FREE plan
    if (request.user.plan === 'FREE') {
      const petCount = await prisma.pet.count({
        where: {
          userId: request.user.id,
          deletedAt: null,
        },
      });

      if (petCount >= MAX_FREE_PETS) {
        throw new AppError(403, 'PLAN_REQUIRED', `Free plan allows a maximum of ${MAX_FREE_PETS} pets`, {
          feature: 'unlimited_pets',
          currentPlan: 'FREE',
          requiredPlan: 'PREMIUM',
          currentCount: petCount,
          limit: MAX_FREE_PETS,
        });
      }
    }

    const data = { ...parsed.data };
    if (data.birthDate) {
      data.birthDate = new Date(data.birthDate);
    }

    const pet = await prisma.pet.create({
      data: {
        ...data,
        userId: request.user.id,
      },
      include: {
        foodConfig: true,
      },
    });

    // Auto-create default food config
    await prisma.foodConfig.create({
      data: {
        petId: pet.id,
      },
    });

    // Re-fetch with food config
    const fullPet = await prisma.pet.findUnique({
      where: { id: pet.id },
      include: { foodConfig: true },
    });

    return reply.status(201).send({ data: fullPet });
  });

  // GET /pets/:petId — pet detail
  fastify.get('/pets/:petId', {
    preHandler: verifyPetOwnership,
  }, async (request) => {
    const pet = await prisma.pet.findUnique({
      where: { id: request.params.petId },
      include: {
        foodConfig: true,
        vaccines: { orderBy: { nextDue: 'asc' }, take: 5 },
        medications: { where: { active: true }, take: 5 },
        weightEntries: { orderBy: { date: 'desc' }, take: 1 },
      },
    });

    return { data: pet };
  });

  // PATCH /pets/:petId — update pet
  fastify.patch('/pets/:petId', {
    preHandler: verifyPetOwnership,
  }, async (request) => {
    const parsed = updatePetSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const data = { ...parsed.data };
    if (data.birthDate) {
      data.birthDate = new Date(data.birthDate);
    }

    const pet = await prisma.pet.update({
      where: { id: request.params.petId },
      data,
      include: { foodConfig: true },
    });

    return { data: pet };
  });

  // DELETE /pets/:petId — soft delete
  fastify.delete('/pets/:petId', {
    preHandler: verifyPetOwnership,
  }, async (request) => {
    await prisma.pet.update({
      where: { id: request.params.petId },
      data: { deletedAt: new Date() },
    });

    return { data: { message: 'Pet removed successfully' } };
  });
}
```

- [ ] **9.4** Create `petlife-backend/tests/factories/pet.js`

```js
import { prisma } from '../setup.js';

let petCounter = 0;

export async function createTestPet(userId, overrides = {}) {
  petCounter++;

  const pet = await prisma.pet.create({
    data: {
      userId,
      name: overrides.name || `Pet ${petCounter}`,
      species: overrides.species || 'DOG',
      breed: overrides.breed || 'SRD',
      weight: overrides.weight || 10.5,
      ...overrides,
    },
  });

  // Auto-create food config like the route does
  await prisma.foodConfig.create({
    data: { petId: pet.id },
  });

  return pet;
}
```

- [ ] **9.5** Update `petlife-backend/src/server.js` to register pets routes

```js
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import errorHandler from './plugins/errorHandler.js';
import authPlugin from './plugins/auth.js';
import corsPlugin from './plugins/cors.js';
import rateLimitPlugin from './plugins/rateLimit.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import petsRoutes from './routes/pets.js';

export function buildApp(opts = {}) {
  const app = Fastify({
    logger: opts.logger ?? (process.env.NODE_ENV !== 'test'),
    ...opts,
  });

  // Plugins
  app.register(errorHandler);
  app.register(corsPlugin);
  app.register(cookie, {
    secret: process.env.JWT_REFRESH_SECRET || 'dev-cookie-secret',
    parseOptions: {},
  });

  if (process.env.NODE_ENV !== 'test') {
    app.register(rateLimitPlugin);
  }

  app.register(authPlugin);

  // Routes
  app.register(authRoutes);
  app.register(meRoutes);
  app.register(petsRoutes);

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}

async function start() {
  const port = parseInt(process.env.PORT || '3001', 10);
  const host = '0.0.0.0';
  const app = buildApp();

  try {
    await app.listen({ port, host });
    console.log(`PetLife API running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

const isMainModule = process.argv[1] &&
  (process.argv[1] === new URL(import.meta.url).pathname ||
   process.argv[1].endsWith('/src/server.js'));

if (isMainModule) {
  start();
}
```

- [ ] **9.6** Create `petlife-backend/tests/routes/pets.test.js`

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/server.js';
import { prisma } from '../setup.js';
import { createTestUser } from '../factories/user.js';
import { createTestPet } from '../factories/pet.js';
import { signAccessToken } from '../../src/utils/jwt.js';

describe('Pets Routes', () => {
  let app;

  beforeEach(async () => {
    app = buildApp({ logger: false });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  function authHeader(user) {
    const token = signAccessToken({ id: user.id, email: user.email, plan: user.plan });
    return { authorization: `Bearer ${token}` };
  }

  describe('GET /pets', () => {
    it('should return user pets', async () => {
      const user = await createTestUser({ email: 'petowner@example.com' });
      await createTestPet(user.id, { name: 'Rex' });
      await createTestPet(user.id, { name: 'Mia', species: 'CAT' });

      const res = await app.inject({
        method: 'GET',
        url: '/pets',
        headers: authHeader(user),
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].foodConfig).toBeDefined();
    });

    it('should not return other user pets', async () => {
      const user1 = await createTestUser({ email: 'user1@example.com' });
      const user2 = await createTestUser({ email: 'user2@example.com' });
      await createTestPet(user1.id, { name: 'Rex' });
      await createTestPet(user2.id, { name: 'Luna' });

      const res = await app.inject({
        method: 'GET',
        url: '/pets',
        headers: authHeader(user1),
      });

      const body = JSON.parse(res.payload);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe('Rex');
    });
  });

  describe('POST /pets', () => {
    it('should create a pet with food config', async () => {
      const user = await createTestUser({ email: 'create@example.com' });

      const res = await app.inject({
        method: 'POST',
        url: '/pets',
        headers: authHeader(user),
        payload: {
          name: 'Buddy',
          species: 'DOG',
          breed: 'Golden Retriever',
          weight: 30.5,
        },
      });

      expect(res.statusCode).toBe(201);

      const body = JSON.parse(res.payload);
      expect(body.data.name).toBe('Buddy');
      expect(body.data.species).toBe('DOG');
      expect(body.data.foodConfig).toBeDefined();
    });

    it('should return 400 for invalid data', async () => {
      const user = await createTestUser({ email: 'invalid@example.com' });

      const res = await app.inject({
        method: 'POST',
        url: '/pets',
        headers: authHeader(user),
        payload: {
          name: '',
          species: 'PARROT',
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should enforce freemium limit of 2 pets on FREE plan', async () => {
      const user = await createTestUser({ email: 'free@example.com', plan: 'FREE' });
      await createTestPet(user.id, { name: 'Pet 1' });
      await createTestPet(user.id, { name: 'Pet 2' });

      const res = await app.inject({
        method: 'POST',
        url: '/pets',
        headers: authHeader(user),
        payload: {
          name: 'Pet 3',
          species: 'DOG',
        },
      });

      expect(res.statusCode).toBe(403);

      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('PLAN_REQUIRED');
      expect(body.error.fields.feature).toBe('unlimited_pets');
    });

    it('should allow PREMIUM users more than 2 pets', async () => {
      const user = await createTestUser({ email: 'premium@example.com', plan: 'PREMIUM' });
      await createTestPet(user.id, { name: 'Pet 1' });
      await createTestPet(user.id, { name: 'Pet 2' });

      const res = await app.inject({
        method: 'POST',
        url: '/pets',
        headers: authHeader(user),
        payload: {
          name: 'Pet 3',
          species: 'CAT',
        },
      });

      expect(res.statusCode).toBe(201);
    });
  });

  describe('GET /pets/:petId', () => {
    it('should return pet detail with health summary', async () => {
      const user = await createTestUser({ email: 'detail@example.com' });
      const pet = await createTestPet(user.id, { name: 'Rex' });

      const res = await app.inject({
        method: 'GET',
        url: `/pets/${pet.id}`,
        headers: authHeader(user),
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data.name).toBe('Rex');
      expect(body.data.foodConfig).toBeDefined();
    });

    it('should return 403 for other user pet', async () => {
      const user1 = await createTestUser({ email: 'owner@example.com' });
      const user2 = await createTestUser({ email: 'stranger@example.com' });
      const pet = await createTestPet(user1.id, { name: 'Rex' });

      const res = await app.inject({
        method: 'GET',
        url: `/pets/${pet.id}`,
        headers: authHeader(user2),
      });

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent pet', async () => {
      const user = await createTestUser({ email: 'nobody@example.com' });

      const res = await app.inject({
        method: 'GET',
        url: '/pets/non-existent-id',
        headers: authHeader(user),
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PATCH /pets/:petId', () => {
    it('should update pet fields', async () => {
      const user = await createTestUser({ email: 'patchpet@example.com' });
      const pet = await createTestPet(user.id, { name: 'Rex' });

      const res = await app.inject({
        method: 'PATCH',
        url: `/pets/${pet.id}`,
        headers: authHeader(user),
        payload: {
          name: 'Rex Jr.',
          weight: 15.2,
        },
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data.name).toBe('Rex Jr.');
      expect(body.data.weight).toBe(15.2);
    });
  });

  describe('DELETE /pets/:petId', () => {
    it('should soft delete pet', async () => {
      const user = await createTestUser({ email: 'deletepet@example.com' });
      const pet = await createTestPet(user.id, { name: 'Rex' });

      const res = await app.inject({
        method: 'DELETE',
        url: `/pets/${pet.id}`,
        headers: authHeader(user),
      });

      expect(res.statusCode).toBe(200);

      const dbPet = await prisma.pet.findUnique({ where: { id: pet.id } });
      expect(dbPet.deletedAt).not.toBeNull();

      // Should not appear in list
      const listRes = await app.inject({
        method: 'GET',
        url: '/pets',
        headers: authHeader(user),
      });

      const listBody = JSON.parse(listRes.payload);
      expect(listBody.data).toHaveLength(0);
    });
  });
});
```

- [ ] **9.7** Run the tests

```bash
cd ~/Documents/petlife/petlife-backend
npx vitest run tests/routes/pets.test.js
```

Expected output:
```
 ✓ tests/routes/pets.test.js (10)
   ✓ Pets Routes > GET /pets (2)
   ✓ Pets Routes > POST /pets (4)
   ✓ Pets Routes > GET /pets/:petId (3)
   ✓ Pets Routes > PATCH /pets/:petId (1)
   ✓ Pets Routes > DELETE /pets/:petId (1)

 Test Files  1 passed (1)
 Tests       10 passed (10) [Note: 1 test is combined in DELETE]
```

- [ ] **9.8** Commit

```bash
cd ~/Documents/petlife/petlife-backend
git add -A
git commit -m "feat(sp1): pets CRUD with ownership check and freemium limit

Full CRUD for pets with auto food config creation. petOwnership
preHandler verifies pet belongs to user. FREE plan limited to 2 pets."
```

---

## Task 10: Health Routes (Vaccines, Dewormings, Medications, Consultations)

**Files:**
- `petlife-backend/src/schemas/health.js`
- `petlife-backend/src/routes/vaccines.js`
- `petlife-backend/src/routes/dewormings.js`
- `petlife-backend/src/routes/medications.js`
- `petlife-backend/src/routes/consultations.js`
- `petlife-backend/tests/routes/health.routes.test.js`

### Steps

- [ ] **10.1** Create `petlife-backend/src/schemas/health.js`

```js
import { z } from 'zod';

export const createVaccineSchema = z.object({
  name: z.string().min(1, 'Vaccine name is required'),
  lastDone: z.string().datetime(),
  nextDue: z.string().datetime().optional().nullable(),
  clinic: z.string().optional().nullable(),
  vet: z.string().optional().nullable(),
});

export const updateVaccineSchema = z.object({
  name: z.string().min(1).optional(),
  lastDone: z.string().datetime().optional(),
  nextDue: z.string().datetime().optional().nullable(),
  clinic: z.string().optional().nullable(),
  vet: z.string().optional().nullable(),
});

export const createDewormingSchema = z.object({
  name: z.string().min(1, 'Deworming name is required'),
  product: z.string().optional().nullable(),
  lastDone: z.string().datetime(),
  nextDue: z.string().datetime().optional().nullable(),
});

export const updateDewormingSchema = z.object({
  name: z.string().min(1).optional(),
  product: z.string().optional().nullable(),
  lastDone: z.string().datetime().optional(),
  nextDue: z.string().datetime().optional().nullable(),
});

export const createMedicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dose: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  startDate: z.string().datetime(),
  duration: z.string().optional().nullable(),
  nextDue: z.string().datetime().optional().nullable(),
  active: z.boolean().optional().default(true),
});

export const updateMedicationSchema = z.object({
  name: z.string().min(1).optional(),
  dose: z.string().optional().nullable(),
  frequency: z.string().optional().nullable(),
  startDate: z.string().datetime().optional(),
  duration: z.string().optional().nullable(),
  nextDue: z.string().datetime().optional().nullable(),
  active: z.boolean().optional(),
});

export const createConsultationSchema = z.object({
  date: z.string().datetime(),
  type: z.string().optional().nullable(),
  clinic: z.string().optional().nullable(),
  vet: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateConsultationSchema = z.object({
  date: z.string().datetime().optional(),
  type: z.string().optional().nullable(),
  clinic: z.string().optional().nullable(),
  vet: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * Calculate health status based on nextDue date.
 * - OVERDUE: nextDue < now
 * - DUE_SOON: nextDue within 7 days
 * - OK: nextDue > 7 days from now
 */
export function calculateHealthStatus(nextDue) {
  if (!nextDue) return 'OK';

  const now = new Date();
  const due = new Date(nextDue);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return 'OVERDUE';
  if (diffDays <= 7) return 'DUE_SOON';
  return 'OK';
}
```

- [ ] **10.2** Create `petlife-backend/src/routes/vaccines.js`

```js
import { prisma } from '../lib/prisma.js';
import { createVaccineSchema, updateVaccineSchema, calculateHealthStatus } from '../schemas/health.js';
import { verifyPetOwnership } from '../plugins/petOwnership.js';
import { AppError } from '../plugins/errorHandler.js';

export default async function vaccinesRoutes(fastify) {
  // All routes require pet ownership
  fastify.addHook('preHandler', verifyPetOwnership);

  // GET /pets/:petId/vaccines
  fastify.get('/pets/:petId/vaccines', async (request) => {
    const vaccines = await prisma.vaccine.findMany({
      where: { petId: request.params.petId },
      orderBy: { nextDue: 'asc' },
    });

    const withStatus = vaccines.map((v) => ({
      ...v,
      status: calculateHealthStatus(v.nextDue),
    }));

    return { data: withStatus };
  });

  // POST /pets/:petId/vaccines
  fastify.post('/pets/:petId/vaccines', async (request, reply) => {
    const parsed = createVaccineSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const data = {
      ...parsed.data,
      lastDone: new Date(parsed.data.lastDone),
      nextDue: parsed.data.nextDue ? new Date(parsed.data.nextDue) : null,
      petId: request.params.petId,
    };

    const vaccine = await prisma.vaccine.create({ data });

    // Auto-create record entry
    await prisma.record.create({
      data: {
        petId: request.params.petId,
        date: data.lastDone,
        type: 'VACCINE',
        title: `Vacina: ${data.name}`,
        description: data.clinic ? `Clinica: ${data.clinic}` : null,
      },
    });

    return reply.status(201).send({
      data: {
        ...vaccine,
        status: calculateHealthStatus(vaccine.nextDue),
      },
    });
  });

  // PATCH /pets/:petId/vaccines/:id
  fastify.patch('/pets/:petId/vaccines/:id', async (request) => {
    const parsed = updateVaccineSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.vaccine.findFirst({
      where: { id: request.params.id, petId: request.params.petId },
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Vaccine not found');
    }

    const data = { ...parsed.data };
    if (data.lastDone) data.lastDone = new Date(data.lastDone);
    if (data.nextDue) data.nextDue = new Date(data.nextDue);

    const vaccine = await prisma.vaccine.update({
      where: { id: request.params.id },
      data,
    });

    return {
      data: {
        ...vaccine,
        status: calculateHealthStatus(vaccine.nextDue),
      },
    };
  });

  // DELETE /pets/:petId/vaccines/:id
  fastify.delete('/pets/:petId/vaccines/:id', async (request) => {
    const existing = await prisma.vaccine.findFirst({
      where: { id: request.params.id, petId: request.params.petId },
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Vaccine not found');
    }

    await prisma.vaccine.delete({ where: { id: request.params.id } });

    return { data: { message: 'Vaccine removed' } };
  });
}
```

- [ ] **10.3** Create `petlife-backend/src/routes/dewormings.js`

```js
import { prisma } from '../lib/prisma.js';
import { createDewormingSchema, updateDewormingSchema, calculateHealthStatus } from '../schemas/health.js';
import { verifyPetOwnership } from '../plugins/petOwnership.js';
import { AppError } from '../plugins/errorHandler.js';

export default async function dewormingsRoutes(fastify) {
  fastify.addHook('preHandler', verifyPetOwnership);

  // GET /pets/:petId/dewormings
  fastify.get('/pets/:petId/dewormings', async (request) => {
    const dewormings = await prisma.deworming.findMany({
      where: { petId: request.params.petId },
      orderBy: { nextDue: 'asc' },
    });

    const withStatus = dewormings.map((d) => ({
      ...d,
      status: calculateHealthStatus(d.nextDue),
    }));

    return { data: withStatus };
  });

  // POST /pets/:petId/dewormings
  fastify.post('/pets/:petId/dewormings', async (request, reply) => {
    const parsed = createDewormingSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const data = {
      ...parsed.data,
      lastDone: new Date(parsed.data.lastDone),
      nextDue: parsed.data.nextDue ? new Date(parsed.data.nextDue) : null,
      petId: request.params.petId,
    };

    const deworming = await prisma.deworming.create({ data });

    await prisma.record.create({
      data: {
        petId: request.params.petId,
        date: data.lastDone,
        type: 'DEWORMING',
        title: `Vermifugo: ${data.name}`,
        description: data.product ? `Produto: ${data.product}` : null,
      },
    });

    return reply.status(201).send({
      data: {
        ...deworming,
        status: calculateHealthStatus(deworming.nextDue),
      },
    });
  });

  // PATCH /pets/:petId/dewormings/:id
  fastify.patch('/pets/:petId/dewormings/:id', async (request) => {
    const parsed = updateDewormingSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.deworming.findFirst({
      where: { id: request.params.id, petId: request.params.petId },
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Deworming not found');
    }

    const data = { ...parsed.data };
    if (data.lastDone) data.lastDone = new Date(data.lastDone);
    if (data.nextDue) data.nextDue = new Date(data.nextDue);

    const deworming = await prisma.deworming.update({
      where: { id: request.params.id },
      data,
    });

    return {
      data: {
        ...deworming,
        status: calculateHealthStatus(deworming.nextDue),
      },
    };
  });

  // DELETE /pets/:petId/dewormings/:id
  fastify.delete('/pets/:petId/dewormings/:id', async (request) => {
    const existing = await prisma.deworming.findFirst({
      where: { id: request.params.id, petId: request.params.petId },
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Deworming not found');
    }

    await prisma.deworming.delete({ where: { id: request.params.id } });

    return { data: { message: 'Deworming removed' } };
  });
}
```

- [ ] **10.4** Create `petlife-backend/src/routes/medications.js`

```js
import { prisma } from '../lib/prisma.js';
import { createMedicationSchema, updateMedicationSchema, calculateHealthStatus } from '../schemas/health.js';
import { verifyPetOwnership } from '../plugins/petOwnership.js';
import { AppError } from '../plugins/errorHandler.js';

export default async function medicationsRoutes(fastify) {
  fastify.addHook('preHandler', verifyPetOwnership);

  // GET /pets/:petId/medications
  fastify.get('/pets/:petId/medications', async (request) => {
    const medications = await prisma.medication.findMany({
      where: { petId: request.params.petId },
      orderBy: { createdAt: 'desc' },
    });

    const withStatus = medications.map((m) => ({
      ...m,
      status: calculateHealthStatus(m.nextDue),
    }));

    return { data: withStatus };
  });

  // POST /pets/:petId/medications
  fastify.post('/pets/:petId/medications', async (request, reply) => {
    const parsed = createMedicationSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const data = {
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      nextDue: parsed.data.nextDue ? new Date(parsed.data.nextDue) : null,
      petId: request.params.petId,
    };

    const medication = await prisma.medication.create({ data });

    await prisma.record.create({
      data: {
        petId: request.params.petId,
        date: data.startDate,
        type: 'MEDICATION',
        title: `Medicamento: ${data.name}`,
        description: data.dose ? `Dose: ${data.dose}` : null,
      },
    });

    return reply.status(201).send({
      data: {
        ...medication,
        status: calculateHealthStatus(medication.nextDue),
      },
    });
  });

  // PATCH /pets/:petId/medications/:id
  fastify.patch('/pets/:petId/medications/:id', async (request) => {
    const parsed = updateMedicationSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.medication.findFirst({
      where: { id: request.params.id, petId: request.params.petId },
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Medication not found');
    }

    const data = { ...parsed.data };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.nextDue) data.nextDue = new Date(data.nextDue);

    const medication = await prisma.medication.update({
      where: { id: request.params.id },
      data,
    });

    return {
      data: {
        ...medication,
        status: calculateHealthStatus(medication.nextDue),
      },
    };
  });

  // DELETE /pets/:petId/medications/:id
  fastify.delete('/pets/:petId/medications/:id', async (request) => {
    const existing = await prisma.medication.findFirst({
      where: { id: request.params.id, petId: request.params.petId },
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Medication not found');
    }

    await prisma.medication.delete({ where: { id: request.params.id } });

    return { data: { message: 'Medication removed' } };
  });
}
```

- [ ] **10.5** Create `petlife-backend/src/routes/consultations.js`

```js
import { prisma } from '../lib/prisma.js';
import { createConsultationSchema, updateConsultationSchema } from '../schemas/health.js';
import { verifyPetOwnership } from '../plugins/petOwnership.js';
import { AppError } from '../plugins/errorHandler.js';

export default async function consultationsRoutes(fastify) {
  fastify.addHook('preHandler', verifyPetOwnership);

  // GET /pets/:petId/consultations
  fastify.get('/pets/:petId/consultations', async (request) => {
    const consultations = await prisma.consultation.findMany({
      where: { petId: request.params.petId },
      orderBy: { date: 'desc' },
    });

    return { data: consultations };
  });

  // POST /pets/:petId/consultations
  fastify.post('/pets/:petId/consultations', async (request, reply) => {
    const parsed = createConsultationSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const data = {
      ...parsed.data,
      date: new Date(parsed.data.date),
      petId: request.params.petId,
    };

    const consultation = await prisma.consultation.create({ data });

    await prisma.record.create({
      data: {
        petId: request.params.petId,
        date: data.date,
        type: 'CONSULTATION',
        title: `Consulta${data.type ? `: ${data.type}` : ''}`,
        description: data.notes || null,
      },
    });

    return reply.status(201).send({ data: consultation });
  });

  // PATCH /pets/:petId/consultations/:id
  fastify.patch('/pets/:petId/consultations/:id', async (request) => {
    const parsed = updateConsultationSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.consultation.findFirst({
      where: { id: request.params.id, petId: request.params.petId },
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Consultation not found');
    }

    const data = { ...parsed.data };
    if (data.date) data.date = new Date(data.date);

    const consultation = await prisma.consultation.update({
      where: { id: request.params.id },
      data,
    });

    return { data: consultation };
  });

  // DELETE /pets/:petId/consultations/:id
  fastify.delete('/pets/:petId/consultations/:id', async (request) => {
    const existing = await prisma.consultation.findFirst({
      where: { id: request.params.id, petId: request.params.petId },
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Consultation not found');
    }

    await prisma.consultation.delete({ where: { id: request.params.id } });

    return { data: { message: 'Consultation removed' } };
  });
}
```

- [ ] **10.6** Update `petlife-backend/src/server.js` to register health routes

```js
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import errorHandler from './plugins/errorHandler.js';
import authPlugin from './plugins/auth.js';
import corsPlugin from './plugins/cors.js';
import rateLimitPlugin from './plugins/rateLimit.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import petsRoutes from './routes/pets.js';
import vaccinesRoutes from './routes/vaccines.js';
import dewormingsRoutes from './routes/dewormings.js';
import medicationsRoutes from './routes/medications.js';
import consultationsRoutes from './routes/consultations.js';

export function buildApp(opts = {}) {
  const app = Fastify({
    logger: opts.logger ?? (process.env.NODE_ENV !== 'test'),
    ...opts,
  });

  // Plugins
  app.register(errorHandler);
  app.register(corsPlugin);
  app.register(cookie, {
    secret: process.env.JWT_REFRESH_SECRET || 'dev-cookie-secret',
    parseOptions: {},
  });

  if (process.env.NODE_ENV !== 'test') {
    app.register(rateLimitPlugin);
  }

  app.register(authPlugin);

  // Routes
  app.register(authRoutes);
  app.register(meRoutes);
  app.register(petsRoutes);
  app.register(vaccinesRoutes);
  app.register(dewormingsRoutes);
  app.register(medicationsRoutes);
  app.register(consultationsRoutes);

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}

async function start() {
  const port = parseInt(process.env.PORT || '3001', 10);
  const host = '0.0.0.0';
  const app = buildApp();

  try {
    await app.listen({ port, host });
    console.log(`PetLife API running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

const isMainModule = process.argv[1] &&
  (process.argv[1] === new URL(import.meta.url).pathname ||
   process.argv[1].endsWith('/src/server.js'));

if (isMainModule) {
  start();
}
```

- [ ] **10.7** Create `petlife-backend/tests/routes/health.routes.test.js`

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/server.js';
import { prisma } from '../setup.js';
import { createTestUser } from '../factories/user.js';
import { createTestPet } from '../factories/pet.js';
import { signAccessToken } from '../../src/utils/jwt.js';

describe('Health Routes', () => {
  let app, user, pet;

  beforeEach(async () => {
    app = buildApp({ logger: false });
    await app.ready();
    user = await createTestUser({ email: 'health@example.com' });
    pet = await createTestPet(user.id, { name: 'Rex' });
  });

  afterEach(async () => {
    await app.close();
  });

  function headers() {
    const token = signAccessToken({ id: user.id, email: user.email, plan: user.plan });
    return { authorization: `Bearer ${token}` };
  }

  // ─── Vaccines ──────────────────────────────────────────

  describe('Vaccines', () => {
    it('should create a vaccine and auto-create record', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/pets/${pet.id}/vaccines`,
        headers: headers(),
        payload: {
          name: 'V10',
          lastDone: '2026-01-15T10:00:00.000Z',
          nextDue: '2027-01-15T10:00:00.000Z',
          clinic: 'PetVet',
          vet: 'Dr. Ana',
        },
      });

      expect(res.statusCode).toBe(201);

      const body = JSON.parse(res.payload);
      expect(body.data.name).toBe('V10');
      expect(body.data.status).toBe('OK');

      // Verify record was auto-created
      const records = await prisma.record.findMany({
        where: { petId: pet.id, type: 'VACCINE' },
      });
      expect(records).toHaveLength(1);
      expect(records[0].title).toContain('V10');
    });

    it('should list vaccines with computed status', async () => {
      // Create an overdue vaccine
      await prisma.vaccine.create({
        data: {
          petId: pet.id,
          name: 'Rabies',
          lastDone: new Date('2025-01-01'),
          nextDue: new Date('2025-06-01'), // past date = overdue
        },
      });

      const res = await app.inject({
        method: 'GET',
        url: `/pets/${pet.id}/vaccines`,
        headers: headers(),
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].status).toBe('OVERDUE');
    });

    it('should update a vaccine', async () => {
      const vaccine = await prisma.vaccine.create({
        data: {
          petId: pet.id,
          name: 'V8',
          lastDone: new Date('2026-01-01'),
        },
      });

      const res = await app.inject({
        method: 'PATCH',
        url: `/pets/${pet.id}/vaccines/${vaccine.id}`,
        headers: headers(),
        payload: { name: 'V10' },
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data.name).toBe('V10');
    });

    it('should delete a vaccine', async () => {
      const vaccine = await prisma.vaccine.create({
        data: {
          petId: pet.id,
          name: 'V8',
          lastDone: new Date('2026-01-01'),
        },
      });

      const res = await app.inject({
        method: 'DELETE',
        url: `/pets/${pet.id}/vaccines/${vaccine.id}`,
        headers: headers(),
      });

      expect(res.statusCode).toBe(200);

      const count = await prisma.vaccine.count({ where: { petId: pet.id } });
      expect(count).toBe(0);
    });
  });

  // ─── Dewormings ────────────────────────────────────────

  describe('Dewormings', () => {
    it('should create a deworming and auto-create record', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/pets/${pet.id}/dewormings`,
        headers: headers(),
        payload: {
          name: 'Drontal',
          product: 'Drontal Plus',
          lastDone: '2026-03-01T10:00:00.000Z',
          nextDue: '2026-06-01T10:00:00.000Z',
        },
      });

      expect(res.statusCode).toBe(201);

      const body = JSON.parse(res.payload);
      expect(body.data.name).toBe('Drontal');
      expect(body.data.product).toBe('Drontal Plus');

      const records = await prisma.record.findMany({
        where: { petId: pet.id, type: 'DEWORMING' },
      });
      expect(records).toHaveLength(1);
    });

    it('should CRUD dewormings', async () => {
      const deworming = await prisma.deworming.create({
        data: {
          petId: pet.id,
          name: 'Milbemax',
          lastDone: new Date('2026-01-01'),
        },
      });

      // List
      const listRes = await app.inject({
        method: 'GET',
        url: `/pets/${pet.id}/dewormings`,
        headers: headers(),
      });
      expect(JSON.parse(listRes.payload).data).toHaveLength(1);

      // Update
      const updateRes = await app.inject({
        method: 'PATCH',
        url: `/pets/${pet.id}/dewormings/${deworming.id}`,
        headers: headers(),
        payload: { product: 'Milbemax Combo' },
      });
      expect(updateRes.statusCode).toBe(200);

      // Delete
      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/pets/${pet.id}/dewormings/${deworming.id}`,
        headers: headers(),
      });
      expect(deleteRes.statusCode).toBe(200);
    });
  });

  // ─── Medications ───────────────────────────────────────

  describe('Medications', () => {
    it('should create a medication and auto-create record', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/pets/${pet.id}/medications`,
        headers: headers(),
        payload: {
          name: 'Prednisolona',
          dose: '5mg',
          frequency: '1x/dia',
          startDate: '2026-03-01T10:00:00.000Z',
          duration: '7 dias',
          active: true,
        },
      });

      expect(res.statusCode).toBe(201);

      const body = JSON.parse(res.payload);
      expect(body.data.name).toBe('Prednisolona');
      expect(body.data.active).toBe(true);

      const records = await prisma.record.findMany({
        where: { petId: pet.id, type: 'MEDICATION' },
      });
      expect(records).toHaveLength(1);
    });

    it('should update medication active status', async () => {
      const med = await prisma.medication.create({
        data: {
          petId: pet.id,
          name: 'Amoxicilina',
          startDate: new Date('2026-03-01'),
          active: true,
        },
      });

      const res = await app.inject({
        method: 'PATCH',
        url: `/pets/${pet.id}/medications/${med.id}`,
        headers: headers(),
        payload: { active: false },
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data.active).toBe(false);
    });
  });

  // ─── Consultations ────────────────────────────────────

  describe('Consultations', () => {
    it('should create a consultation and auto-create record', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/pets/${pet.id}/consultations`,
        headers: headers(),
        payload: {
          date: '2026-03-20T14:00:00.000Z',
          type: 'Rotina',
          clinic: 'PetVet',
          vet: 'Dr. Carlos',
          notes: 'Tudo normal, pet saudavel.',
        },
      });

      expect(res.statusCode).toBe(201);

      const body = JSON.parse(res.payload);
      expect(body.data.type).toBe('Rotina');
      expect(body.data.notes).toContain('saudavel');

      const records = await prisma.record.findMany({
        where: { petId: pet.id, type: 'CONSULTATION' },
      });
      expect(records).toHaveLength(1);
    });

    it('should CRUD consultations', async () => {
      const consult = await prisma.consultation.create({
        data: {
          petId: pet.id,
          date: new Date('2026-02-15'),
          clinic: 'PetShop',
        },
      });

      // Update
      const updateRes = await app.inject({
        method: 'PATCH',
        url: `/pets/${pet.id}/consultations/${consult.id}`,
        headers: headers(),
        payload: { notes: 'Updated notes' },
      });
      expect(updateRes.statusCode).toBe(200);
      expect(JSON.parse(updateRes.payload).data.notes).toBe('Updated notes');

      // Delete
      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/pets/${pet.id}/consultations/${consult.id}`,
        headers: headers(),
      });
      expect(deleteRes.statusCode).toBe(200);
    });
  });

  // ─── Status Calculation ────────────────────────────────

  describe('Status Calculation', () => {
    it('should mark as OVERDUE when nextDue is in the past', async () => {
      await prisma.vaccine.create({
        data: {
          petId: pet.id,
          name: 'Overdue Vaccine',
          lastDone: new Date('2024-01-01'),
          nextDue: new Date('2025-01-01'), // Past date
        },
      });

      const res = await app.inject({
        method: 'GET',
        url: `/pets/${pet.id}/vaccines`,
        headers: headers(),
      });

      const body = JSON.parse(res.payload);
      expect(body.data[0].status).toBe('OVERDUE');
    });

    it('should mark as DUE_SOON when nextDue is within 7 days', async () => {
      const inFiveDays = new Date();
      inFiveDays.setDate(inFiveDays.getDate() + 5);

      await prisma.vaccine.create({
        data: {
          petId: pet.id,
          name: 'Soon Vaccine',
          lastDone: new Date('2025-06-01'),
          nextDue: inFiveDays,
        },
      });

      const res = await app.inject({
        method: 'GET',
        url: `/pets/${pet.id}/vaccines`,
        headers: headers(),
      });

      const body = JSON.parse(res.payload);
      expect(body.data[0].status).toBe('DUE_SOON');
    });

    it('should mark as OK when nextDue is more than 7 days away', async () => {
      const inThirtyDays = new Date();
      inThirtyDays.setDate(inThirtyDays.getDate() + 30);

      await prisma.vaccine.create({
        data: {
          petId: pet.id,
          name: 'OK Vaccine',
          lastDone: new Date('2026-01-01'),
          nextDue: inThirtyDays,
        },
      });

      const res = await app.inject({
        method: 'GET',
        url: `/pets/${pet.id}/vaccines`,
        headers: headers(),
      });

      const body = JSON.parse(res.payload);
      expect(body.data[0].status).toBe('OK');
    });
  });
});
```

- [ ] **10.8** Run the tests

```bash
cd ~/Documents/petlife/petlife-backend
npx vitest run tests/routes/health.routes.test.js
```

Expected output:
```
 ✓ tests/routes/health.routes.test.js (12)
   ✓ Health Routes > Vaccines (4)
   ✓ Health Routes > Dewormings (2)
   ✓ Health Routes > Medications (2)
   ✓ Health Routes > Consultations (2)
   ✓ Health Routes > Status Calculation (3)

 Test Files  1 passed (1)
 Tests       13 passed (13)
```

- [ ] **10.9** Commit

```bash
cd ~/Documents/petlife/petlife-backend
git add -A
git commit -m "feat(sp1): health routes — vaccines, dewormings, medications, consultations

CRUD for all 4 health resources with server-side status calculation
(OK/DUE_SOON/OVERDUE). Each POST auto-creates a Record entry for
the pet prontuario."
```

---

## Task 11: Food & Weight Routes

**Files:**
- `petlife-backend/src/schemas/food.js`
- `petlife-backend/src/routes/food.js`
- `petlife-backend/tests/routes/food.test.js`

### Steps

- [ ] **11.1** Create `petlife-backend/src/schemas/food.js`

```js
import { z } from 'zod';

export const updateFoodConfigSchema = z.object({
  brand: z.string().max(100).optional().nullable(),
  line: z.string().max(100).optional().nullable(),
  type: z.enum(['DRY', 'WET', 'RAW', 'HOMEMADE', 'MIXED']).optional(),
  portionGrams: z.number().positive().optional().nullable(),
  mealsPerDay: z.number().int().min(1).max(10).optional(),
  schedule: z.array(z.string()).optional(),
});

export const createMealLogSchema = z.object({
  date: z.string().datetime(),
  time: z.string().min(1, 'Time is required'), // e.g., "08:00"
  given: z.boolean().optional().default(true),
});

export const createWeightEntrySchema = z.object({
  date: z.string().datetime(),
  value: z.number().positive('Weight must be greater than 0'),
});
```

- [ ] **11.2** Create `petlife-backend/src/routes/food.js`

```js
import { prisma } from '../lib/prisma.js';
import { updateFoodConfigSchema, createMealLogSchema, createWeightEntrySchema } from '../schemas/food.js';
import { verifyPetOwnership } from '../plugins/petOwnership.js';
import { AppError } from '../plugins/errorHandler.js';

export default async function foodRoutes(fastify) {
  fastify.addHook('preHandler', verifyPetOwnership);

  // ─── Food Config ─────────────────────────────────────

  // GET /pets/:petId/food
  fastify.get('/pets/:petId/food', async (request) => {
    let config = await prisma.foodConfig.findUnique({
      where: { petId: request.params.petId },
    });

    if (!config) {
      config = await prisma.foodConfig.create({
        data: { petId: request.params.petId },
      });
    }

    return { data: config };
  });

  // PATCH /pets/:petId/food
  fastify.patch('/pets/:petId/food', async (request) => {
    const parsed = updateFoodConfigSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    let config = await prisma.foodConfig.findUnique({
      where: { petId: request.params.petId },
    });

    if (!config) {
      config = await prisma.foodConfig.create({
        data: { petId: request.params.petId, ...parsed.data },
      });
    } else {
      config = await prisma.foodConfig.update({
        where: { petId: request.params.petId },
        data: parsed.data,
      });
    }

    return { data: config };
  });

  // ─── Meal Logs ───────────────────────────────────────

  // GET /pets/:petId/meals?date=YYYY-MM-DD
  fastify.get('/pets/:petId/meals', async (request) => {
    const { date } = request.query;

    const where = { petId: request.params.petId };

    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);
      where.date = { gte: start, lte: end };
    }

    const meals = await prisma.mealLog.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return { data: meals };
  });

  // POST /pets/:petId/meals
  fastify.post('/pets/:petId/meals', async (request, reply) => {
    const parsed = createMealLogSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const meal = await prisma.mealLog.create({
      data: {
        petId: request.params.petId,
        date: new Date(parsed.data.date),
        time: parsed.data.time,
        given: parsed.data.given,
      },
    });

    return reply.status(201).send({ data: meal });
  });

  // ─── Weight ──────────────────────────────────────────

  // GET /pets/:petId/weight
  fastify.get('/pets/:petId/weight', async (request) => {
    const plan = request.user.plan;

    const where = { petId: request.params.petId };

    // Freemium gate: FREE plan only gets last 3 months
    if (plan === 'FREE') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      where.date = { gte: threeMonthsAgo };
    }

    const entries = await prisma.weightEntry.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return {
      data: entries,
      meta: {
        limited: plan === 'FREE',
        plan,
      },
    };
  });

  // POST /pets/:petId/weight
  fastify.post('/pets/:petId/weight', async (request, reply) => {
    const parsed = createWeightEntrySchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const entry = await prisma.weightEntry.create({
      data: {
        petId: request.params.petId,
        date: new Date(parsed.data.date),
        value: parsed.data.value,
      },
    });

    // Also update pet's current weight
    await prisma.pet.update({
      where: { id: request.params.petId },
      data: { weight: parsed.data.value },
    });

    return reply.status(201).send({ data: entry });
  });
}
```

- [ ] **11.3** Update `petlife-backend/src/server.js` to register food routes

```js
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import errorHandler from './plugins/errorHandler.js';
import authPlugin from './plugins/auth.js';
import corsPlugin from './plugins/cors.js';
import rateLimitPlugin from './plugins/rateLimit.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import petsRoutes from './routes/pets.js';
import vaccinesRoutes from './routes/vaccines.js';
import dewormingsRoutes from './routes/dewormings.js';
import medicationsRoutes from './routes/medications.js';
import consultationsRoutes from './routes/consultations.js';
import foodRoutes from './routes/food.js';

export function buildApp(opts = {}) {
  const app = Fastify({
    logger: opts.logger ?? (process.env.NODE_ENV !== 'test'),
    ...opts,
  });

  // Plugins
  app.register(errorHandler);
  app.register(corsPlugin);
  app.register(cookie, {
    secret: process.env.JWT_REFRESH_SECRET || 'dev-cookie-secret',
    parseOptions: {},
  });

  if (process.env.NODE_ENV !== 'test') {
    app.register(rateLimitPlugin);
  }

  app.register(authPlugin);

  // Routes
  app.register(authRoutes);
  app.register(meRoutes);
  app.register(petsRoutes);
  app.register(vaccinesRoutes);
  app.register(dewormingsRoutes);
  app.register(medicationsRoutes);
  app.register(consultationsRoutes);
  app.register(foodRoutes);

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}

async function start() {
  const port = parseInt(process.env.PORT || '3001', 10);
  const host = '0.0.0.0';
  const app = buildApp();

  try {
    await app.listen({ port, host });
    console.log(`PetLife API running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

const isMainModule = process.argv[1] &&
  (process.argv[1] === new URL(import.meta.url).pathname ||
   process.argv[1].endsWith('/src/server.js'));

if (isMainModule) {
  start();
}
```

- [ ] **11.4** Create `petlife-backend/tests/routes/food.test.js`

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/server.js';
import { prisma } from '../setup.js';
import { createTestUser } from '../factories/user.js';
import { createTestPet } from '../factories/pet.js';
import { signAccessToken } from '../../src/utils/jwt.js';

describe('Food & Weight Routes', () => {
  let app, user, pet;

  beforeEach(async () => {
    app = buildApp({ logger: false });
    await app.ready();
    user = await createTestUser({ email: 'food@example.com' });
    pet = await createTestPet(user.id, { name: 'Rex' });
  });

  afterEach(async () => {
    await app.close();
  });

  function headers(overrideUser) {
    const u = overrideUser || user;
    const token = signAccessToken({ id: u.id, email: u.email, plan: u.plan });
    return { authorization: `Bearer ${token}` };
  }

  describe('Food Config', () => {
    it('should get default food config', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/pets/${pet.id}/food`,
        headers: headers(),
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data.petId).toBe(pet.id);
      expect(body.data.type).toBe('DRY');
      expect(body.data.mealsPerDay).toBe(2);
    });

    it('should update food config', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/pets/${pet.id}/food`,
        headers: headers(),
        payload: {
          brand: 'Royal Canin',
          line: 'Medium Adult',
          type: 'DRY',
          portionGrams: 250,
          mealsPerDay: 3,
          schedule: ['08:00', '13:00', '19:00'],
        },
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data.brand).toBe('Royal Canin');
      expect(body.data.portionGrams).toBe(250);
      expect(body.data.mealsPerDay).toBe(3);
      expect(body.data.schedule).toEqual(['08:00', '13:00', '19:00']);
    });
  });

  describe('Meal Logs', () => {
    it('should log a meal', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/pets/${pet.id}/meals`,
        headers: headers(),
        payload: {
          date: '2026-03-30T08:00:00.000Z',
          time: '08:00',
          given: true,
        },
      });

      expect(res.statusCode).toBe(201);

      const body = JSON.parse(res.payload);
      expect(body.data.time).toBe('08:00');
      expect(body.data.given).toBe(true);
    });

    it('should list meals for a specific date', async () => {
      await prisma.mealLog.createMany({
        data: [
          { petId: pet.id, date: new Date('2026-03-30'), time: '08:00', given: true },
          { petId: pet.id, date: new Date('2026-03-30'), time: '13:00', given: true },
          { petId: pet.id, date: new Date('2026-03-29'), time: '08:00', given: true },
        ],
      });

      const res = await app.inject({
        method: 'GET',
        url: `/pets/${pet.id}/meals?date=2026-03-30`,
        headers: headers(),
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data).toHaveLength(2);
    });
  });

  describe('Weight', () => {
    it('should add a weight entry and update pet weight', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/pets/${pet.id}/weight`,
        headers: headers(),
        payload: {
          date: '2026-03-30T10:00:00.000Z',
          value: 12.5,
        },
      });

      expect(res.statusCode).toBe(201);

      const body = JSON.parse(res.payload);
      expect(body.data.value).toBe(12.5);

      // Verify pet weight was updated
      const updatedPet = await prisma.pet.findUnique({ where: { id: pet.id } });
      expect(updatedPet.weight).toBe(12.5);
    });

    it('should return weight history', async () => {
      await prisma.weightEntry.createMany({
        data: [
          { petId: pet.id, date: new Date('2026-01-01'), value: 10 },
          { petId: pet.id, date: new Date('2026-02-01'), value: 11 },
          { petId: pet.id, date: new Date('2026-03-01'), value: 12 },
        ],
      });

      const res = await app.inject({
        method: 'GET',
        url: `/pets/${pet.id}/weight`,
        headers: headers(),
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data).toHaveLength(3);
      expect(body.meta.plan).toBe('FREE');
    });

    it('should limit weight history to 3 months for FREE plan', async () => {
      await prisma.weightEntry.createMany({
        data: [
          { petId: pet.id, date: new Date('2025-06-01'), value: 8 },  // old
          { petId: pet.id, date: new Date('2025-09-01'), value: 9 },  // old
          { petId: pet.id, date: new Date('2026-02-01'), value: 11 }, // recent
          { petId: pet.id, date: new Date('2026-03-01'), value: 12 }, // recent
        ],
      });

      const res = await app.inject({
        method: 'GET',
        url: `/pets/${pet.id}/weight`,
        headers: headers(),
      });

      const body = JSON.parse(res.payload);
      // Only entries within last 3 months should be returned
      expect(body.data.length).toBeLessThanOrEqual(3);
      expect(body.meta.limited).toBe(true);
    });

    it('should return full weight history for PREMIUM plan', async () => {
      const premiumUser = await createTestUser({ email: 'premium-food@example.com', plan: 'PREMIUM' });
      const premiumPet = await createTestPet(premiumUser.id, { name: 'Luna' });

      await prisma.weightEntry.createMany({
        data: [
          { petId: premiumPet.id, date: new Date('2024-01-01'), value: 5 },
          { petId: premiumPet.id, date: new Date('2025-01-01'), value: 8 },
          { petId: premiumPet.id, date: new Date('2026-01-01'), value: 10 },
          { petId: premiumPet.id, date: new Date('2026-03-01'), value: 12 },
        ],
      });

      const res = await app.inject({
        method: 'GET',
        url: `/pets/${premiumPet.id}/weight`,
        headers: headers(premiumUser),
      });

      const body = JSON.parse(res.payload);
      expect(body.data).toHaveLength(4);
      expect(body.meta.limited).toBe(false);
    });
  });
});
```

- [ ] **11.5** Run the tests

```bash
cd ~/Documents/petlife/petlife-backend
npx vitest run tests/routes/food.test.js
```

Expected output:
```
 ✓ tests/routes/food.test.js (7)
   ✓ Food & Weight Routes > Food Config (2)
   ✓ Food & Weight Routes > Meal Logs (2)
   ✓ Food & Weight Routes > Weight (4) [Note: includes freemium test]

 Test Files  1 passed (1)
 Tests       7 passed (7)
```

- [ ] **11.6** Commit

```bash
cd ~/Documents/petlife/petlife-backend
git add -A
git commit -m "feat(sp1): food config, meal logging, and weight tracking

Food config CRUD, meal log by date, weight history with freemium
gate (FREE: last 3 months, PREMIUM: full history). Weight entries
auto-update pet current weight."
```

---

## Task 12: Records Routes & File Upload

**Files:**
- `petlife-backend/src/schemas/records.js`
- `petlife-backend/src/routes/records.js`
- `petlife-backend/src/utils/storage.js`
- `petlife-backend/tests/routes/records.test.js`

### Steps

- [ ] **12.1** Create `petlife-backend/src/utils/storage.js`

```js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

let s3Client = null;

function getS3Client() {
  if (!s3Client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      return null;
    }

    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return s3Client;
}

export async function uploadToR2(buffer, key, mimeType) {
  const client = getS3Client();
  const bucketName = process.env.R2_BUCKET_NAME || 'petlife-uploads';

  if (!client) {
    // Dev/test fallback: return a mock URL
    console.log(`[STORAGE MOCK] Upload: ${key} (${mimeType}, ${buffer.length} bytes)`);
    const publicUrl = process.env.R2_PUBLIC_URL || 'https://cdn.petlife.app';
    return `${publicUrl}/${key}`;
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });

  await client.send(command);

  return getPublicUrl(key);
}

export function getPublicUrl(key) {
  const publicUrl = process.env.R2_PUBLIC_URL || 'https://cdn.petlife.app';
  return `${publicUrl}/${key}`;
}

// Allowed MIME types for uploads
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateUpload(mimeType, size) {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: `File type ${mimeType} is not allowed. Allowed: jpg, png, webp, pdf` };
  }

  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds maximum of 5MB` };
  }

  return { valid: true };
}

// For testing
export function setS3Client(client) {
  s3Client = client;
}
```

- [ ] **12.2** Create `petlife-backend/src/schemas/records.js`

```js
import { z } from 'zod';

export const createRecordSchema = z.object({
  date: z.string().datetime(),
  type: z.enum(['VACCINE', 'DEWORMING', 'MEDICATION', 'CONSULTATION', 'EXAM', 'SURGERY', 'NOTE']),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().nullable(),
});

export const updateRecordSchema = z.object({
  date: z.string().datetime().optional(),
  type: z.enum(['VACCINE', 'DEWORMING', 'MEDICATION', 'CONSULTATION', 'EXAM', 'SURGERY', 'NOTE']).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
});

export const recordsQuerySchema = z.object({
  type: z.enum(['VACCINE', 'DEWORMING', 'MEDICATION', 'CONSULTATION', 'EXAM', 'SURGERY', 'NOTE']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
```

- [ ] **12.3** Create `petlife-backend/src/routes/records.js`

```js
import { prisma } from '../lib/prisma.js';
import { createRecordSchema, updateRecordSchema, recordsQuerySchema } from '../schemas/records.js';
import { verifyPetOwnership } from '../plugins/petOwnership.js';
import { uploadToR2, validateUpload } from '../utils/storage.js';
import { AppError } from '../plugins/errorHandler.js';
import multipart from '@fastify/multipart';
import crypto from 'node:crypto';

const MAX_FREE_ATTACHMENTS = 3;

export default async function recordsRoutes(fastify) {
  fastify.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  });

  fastify.addHook('preHandler', verifyPetOwnership);

  // GET /pets/:petId/records — paginated + filtered
  fastify.get('/pets/:petId/records', async (request) => {
    const parsed = recordsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid query parameters',
        parsed.error.flatten().fieldErrors);
    }

    const { type, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const where = { petId: request.params.petId };
    if (type) {
      where.type = type;
    }

    const [records, total] = await Promise.all([
      prisma.record.findMany({
        where,
        include: { attachments: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.record.count({ where }),
    ]);

    return {
      data: records,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

  // POST /pets/:petId/records
  fastify.post('/pets/:petId/records', async (request, reply) => {
    const parsed = createRecordSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const record = await prisma.record.create({
      data: {
        petId: request.params.petId,
        date: new Date(parsed.data.date),
        type: parsed.data.type,
        title: parsed.data.title,
        description: parsed.data.description || null,
      },
      include: { attachments: true },
    });

    return reply.status(201).send({ data: record });
  });

  // PATCH /pets/:petId/records/:id
  fastify.patch('/pets/:petId/records/:id', async (request) => {
    const parsed = updateRecordSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid input',
        parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.record.findFirst({
      where: { id: request.params.id, petId: request.params.petId },
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Record not found');
    }

    const data = { ...parsed.data };
    if (data.date) data.date = new Date(data.date);

    const record = await prisma.record.update({
      where: { id: request.params.id },
      data,
      include: { attachments: true },
    });

    return { data: record };
  });

  // DELETE /pets/:petId/records/:id
  fastify.delete('/pets/:petId/records/:id', async (request) => {
    const existing = await prisma.record.findFirst({
      where: { id: request.params.id, petId: request.params.petId },
    });

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Record not found');
    }

    // Delete attachments first (cascade should handle this, but be explicit)
    await prisma.attachment.deleteMany({ where: { recordId: request.params.id } });
    await prisma.record.delete({ where: { id: request.params.id } });

    return { data: { message: 'Record removed' } };
  });

  // POST /pets/:petId/records/:id/attachments — upload file
  fastify.post('/pets/:petId/records/:id/attachments', async (request, reply) => {
    const recordId = request.params.id;
    const petId = request.params.petId;

    // Verify record exists and belongs to pet
    const record = await prisma.record.findFirst({
      where: { id: recordId, petId },
    });

    if (!record) {
      throw new AppError(404, 'NOT_FOUND', 'Record not found');
    }

    // Freemium gate: max 3 attachments per pet on FREE plan
    if (request.user.plan === 'FREE') {
      const totalAttachments = await prisma.attachment.count({
        where: {
          record: { petId },
        },
      });

      if (totalAttachments >= MAX_FREE_ATTACHMENTS) {
        throw new AppError(403, 'PLAN_REQUIRED', `Free plan allows a maximum of ${MAX_FREE_ATTACHMENTS} attachments per pet`, {
          feature: 'unlimited_attachments',
          currentPlan: 'FREE',
          requiredPlan: 'PREMIUM',
          currentCount: totalAttachments,
          limit: MAX_FREE_ATTACHMENTS,
        });
      }
    }

    const file = await request.file();

    if (!file) {
      throw new AppError(400, 'BAD_REQUEST', 'No file uploaded');
    }

    const buffer = await file.toBuffer();
    const mimeType = file.mimetype;
    const originalFilename = file.filename;
    const fileSize = buffer.length;

    // Validate file
    const validation = validateUpload(mimeType, fileSize);
    if (!validation.valid) {
      throw new AppError(400, 'INVALID_FILE', validation.error);
    }

    // Generate storage key
    const ext = originalFilename.split('.').pop() || 'bin';
    const uniqueId = crypto.randomUUID();
    const key = `${request.user.id}/records/${recordId}/${uniqueId}.${ext}`;

    // Upload to R2
    const url = await uploadToR2(buffer, key, mimeType);

    // Save attachment record
    const attachment = await prisma.attachment.create({
      data: {
        recordId,
        filename: originalFilename,
        url,
        mimeType,
        size: fileSize,
      },
    });

    return reply.status(201).send({ data: attachment });
  });
}
```

- [ ] **12.4** Update `petlife-backend/src/server.js` to register records routes (final version)

```js
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import errorHandler from './plugins/errorHandler.js';
import authPlugin from './plugins/auth.js';
import corsPlugin from './plugins/cors.js';
import rateLimitPlugin from './plugins/rateLimit.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import petsRoutes from './routes/pets.js';
import vaccinesRoutes from './routes/vaccines.js';
import dewormingsRoutes from './routes/dewormings.js';
import medicationsRoutes from './routes/medications.js';
import consultationsRoutes from './routes/consultations.js';
import foodRoutes from './routes/food.js';
import recordsRoutes from './routes/records.js';

export function buildApp(opts = {}) {
  const app = Fastify({
    logger: opts.logger ?? (process.env.NODE_ENV !== 'test'),
    ...opts,
  });

  // Plugins
  app.register(errorHandler);
  app.register(corsPlugin);
  app.register(cookie, {
    secret: process.env.JWT_REFRESH_SECRET || 'dev-cookie-secret',
    parseOptions: {},
  });

  if (process.env.NODE_ENV !== 'test') {
    app.register(rateLimitPlugin);
  }

  app.register(authPlugin);

  // Routes
  app.register(authRoutes);
  app.register(meRoutes);
  app.register(petsRoutes);
  app.register(vaccinesRoutes);
  app.register(dewormingsRoutes);
  app.register(medicationsRoutes);
  app.register(consultationsRoutes);
  app.register(foodRoutes);
  app.register(recordsRoutes);

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}

async function start() {
  const port = parseInt(process.env.PORT || '3001', 10);
  const host = '0.0.0.0';
  const app = buildApp();

  try {
    await app.listen({ port, host });
    console.log(`PetLife API running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

const isMainModule = process.argv[1] &&
  (process.argv[1] === new URL(import.meta.url).pathname ||
   process.argv[1].endsWith('/src/server.js'));

if (isMainModule) {
  start();
}
```

- [ ] **12.5** Create `petlife-backend/tests/routes/records.test.js`

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../../src/server.js';
import { prisma } from '../setup.js';
import { createTestUser } from '../factories/user.js';
import { createTestPet } from '../factories/pet.js';
import { signAccessToken } from '../../src/utils/jwt.js';

describe('Records Routes', () => {
  let app, user, pet;

  beforeEach(async () => {
    app = buildApp({ logger: false });
    await app.ready();
    user = await createTestUser({ email: 'records@example.com' });
    pet = await createTestPet(user.id, { name: 'Rex' });
  });

  afterEach(async () => {
    await app.close();
  });

  function headers(overrideUser) {
    const u = overrideUser || user;
    const token = signAccessToken({ id: u.id, email: u.email, plan: u.plan });
    return { authorization: `Bearer ${token}` };
  }

  describe('POST /pets/:petId/records', () => {
    it('should create a record', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/pets/${pet.id}/records`,
        headers: headers(),
        payload: {
          date: '2026-03-20T10:00:00.000Z',
          type: 'EXAM',
          title: 'Exame de sangue completo',
          description: 'Hemograma + bioquimico',
        },
      });

      expect(res.statusCode).toBe(201);

      const body = JSON.parse(res.payload);
      expect(body.data.title).toBe('Exame de sangue completo');
      expect(body.data.type).toBe('EXAM');
      expect(body.data.attachments).toEqual([]);
    });
  });

  describe('GET /pets/:petId/records', () => {
    it('should return paginated records', async () => {
      // Create 25 records
      for (let i = 0; i < 25; i++) {
        await prisma.record.create({
          data: {
            petId: pet.id,
            date: new Date(`2026-03-${String(i + 1).padStart(2, '0')}`),
            type: 'NOTE',
            title: `Record ${i + 1}`,
          },
        });
      }

      // Page 1
      const res1 = await app.inject({
        method: 'GET',
        url: `/pets/${pet.id}/records?page=1&limit=10`,
        headers: headers(),
      });

      const body1 = JSON.parse(res1.payload);
      expect(body1.data).toHaveLength(10);
      expect(body1.meta.total).toBe(25);
      expect(body1.meta.totalPages).toBe(3);
      expect(body1.meta.page).toBe(1);

      // Page 3
      const res3 = await app.inject({
        method: 'GET',
        url: `/pets/${pet.id}/records?page=3&limit=10`,
        headers: headers(),
      });

      const body3 = JSON.parse(res3.payload);
      expect(body3.data).toHaveLength(5);
    });

    it('should filter records by type', async () => {
      await prisma.record.createMany({
        data: [
          { petId: pet.id, date: new Date(), type: 'VACCINE', title: 'V10' },
          { petId: pet.id, date: new Date(), type: 'EXAM', title: 'Blood test' },
          { petId: pet.id, date: new Date(), type: 'VACCINE', title: 'Rabies' },
        ],
      });

      const res = await app.inject({
        method: 'GET',
        url: `/pets/${pet.id}/records?type=VACCINE`,
        headers: headers(),
      });

      const body = JSON.parse(res.payload);
      expect(body.data).toHaveLength(2);
      expect(body.data.every(r => r.type === 'VACCINE')).toBe(true);
    });
  });

  describe('PATCH /pets/:petId/records/:id', () => {
    it('should update a record', async () => {
      const record = await prisma.record.create({
        data: {
          petId: pet.id,
          date: new Date(),
          type: 'NOTE',
          title: 'Original title',
        },
      });

      const res = await app.inject({
        method: 'PATCH',
        url: `/pets/${pet.id}/records/${record.id}`,
        headers: headers(),
        payload: {
          title: 'Updated title',
          description: 'Added description',
        },
      });

      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.payload);
      expect(body.data.title).toBe('Updated title');
      expect(body.data.description).toBe('Added description');
    });
  });

  describe('DELETE /pets/:petId/records/:id', () => {
    it('should delete a record', async () => {
      const record = await prisma.record.create({
        data: {
          petId: pet.id,
          date: new Date(),
          type: 'NOTE',
          title: 'To delete',
        },
      });

      const res = await app.inject({
        method: 'DELETE',
        url: `/pets/${pet.id}/records/${record.id}`,
        headers: headers(),
      });

      expect(res.statusCode).toBe(200);

      const count = await prisma.record.count({ where: { petId: pet.id } });
      expect(count).toBe(0);
    });

    it('should return 404 for non-existent record', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/pets/${pet.id}/records/non-existent`,
        headers: headers(),
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /pets/:petId/records/:id/attachments', () => {
    it('should upload an attachment (mock R2)', async () => {
      const record = await prisma.record.create({
        data: {
          petId: pet.id,
          date: new Date(),
          type: 'EXAM',
          title: 'Blood test',
        },
      });

      const form = require('form-data');
      const formData = new form();
      const fakeFile = Buffer.from('fake-pdf-content');
      formData.append('file', fakeFile, {
        filename: 'exam-result.pdf',
        contentType: 'application/pdf',
      });

      const res = await app.inject({
        method: 'POST',
        url: `/pets/${pet.id}/records/${record.id}/attachments`,
        headers: {
          ...headers(),
          ...formData.getHeaders(),
        },
        payload: formData,
      });

      expect(res.statusCode).toBe(201);

      const body = JSON.parse(res.payload);
      expect(body.data.filename).toBe('exam-result.pdf');
      expect(body.data.mimeType).toBe('application/pdf');
      expect(body.data.url).toContain('cdn.petlife.app');
    });

    it('should enforce freemium limit of 3 attachments per pet', async () => {
      // Create 3 attachments on different records
      for (let i = 0; i < 3; i++) {
        const record = await prisma.record.create({
          data: {
            petId: pet.id,
            date: new Date(),
            type: 'EXAM',
            title: `Exam ${i}`,
          },
        });

        await prisma.attachment.create({
          data: {
            recordId: record.id,
            filename: `file${i}.pdf`,
            url: `https://cdn.petlife.app/test/${i}.pdf`,
            mimeType: 'application/pdf',
            size: 1000,
          },
        });
      }

      // Try to upload a 4th
      const newRecord = await prisma.record.create({
        data: {
          petId: pet.id,
          date: new Date(),
          type: 'EXAM',
          title: 'Another exam',
        },
      });

      const form = require('form-data');
      const formData = new form();
      const fakeFile = Buffer.from('fake-content');
      formData.append('file', fakeFile, {
        filename: 'blocked.pdf',
        contentType: 'application/pdf',
      });

      const res = await app.inject({
        method: 'POST',
        url: `/pets/${pet.id}/records/${newRecord.id}/attachments`,
        headers: {
          ...headers(),
          ...formData.getHeaders(),
        },
        payload: formData,
      });

      expect(res.statusCode).toBe(403);

      const body = JSON.parse(res.payload);
      expect(body.error.code).toBe('PLAN_REQUIRED');
      expect(body.error.fields.feature).toBe('unlimited_attachments');
    });

    it('should allow PREMIUM users unlimited attachments', async () => {
      const premiumUser = await createTestUser({ email: 'premium-rec@example.com', plan: 'PREMIUM' });
      const premiumPet = await createTestPet(premiumUser.id, { name: 'Luna' });

      // Create 3 existing attachments
      for (let i = 0; i < 3; i++) {
        const record = await prisma.record.create({
          data: {
            petId: premiumPet.id,
            date: new Date(),
            type: 'EXAM',
            title: `Exam ${i}`,
          },
        });

        await prisma.attachment.create({
          data: {
            recordId: record.id,
            filename: `file${i}.pdf`,
            url: `https://cdn.petlife.app/test/${i}.pdf`,
            mimeType: 'application/pdf',
            size: 1000,
          },
        });
      }

      // 4th upload should succeed
      const newRecord = await prisma.record.create({
        data: {
          petId: premiumPet.id,
          date: new Date(),
          type: 'EXAM',
          title: 'Extra exam',
        },
      });

      const form = require('form-data');
      const formData = new form();
      const fakeFile = Buffer.from('premium-content');
      formData.append('file', fakeFile, {
        filename: 'premium.pdf',
        contentType: 'application/pdf',
      });

      const res = await app.inject({
        method: 'POST',
        url: `/pets/${premiumPet.id}/records/${newRecord.id}/attachments`,
        headers: {
          ...headers(premiumUser),
          ...formData.getHeaders(),
        },
        payload: formData,
      });

      expect(res.statusCode).toBe(201);
    });
  });
});
```

- [ ] **12.6** Install form-data for tests

```bash
cd ~/Documents/petlife/petlife-backend
npm install --save-dev form-data
```

- [ ] **12.7** Run the tests

```bash
cd ~/Documents/petlife/petlife-backend
npx vitest run tests/routes/records.test.js
```

Expected output:
```
 ✓ tests/routes/records.test.js (8)
   ✓ Records Routes > POST /pets/:petId/records (1)
   ✓ Records Routes > GET /pets/:petId/records (2)
   ✓ Records Routes > PATCH /pets/:petId/records/:id (1)
   ✓ Records Routes > DELETE /pets/:petId/records/:id (2)
   ✓ Records Routes > POST /pets/:petId/records/:id/attachments (3)

 Test Files  1 passed (1)
 Tests       8 passed (8)
```

- [ ] **12.8** Run the full test suite to confirm everything works together

```bash
cd ~/Documents/petlife/petlife-backend
npx vitest run
```

Expected output:
```
 ✓ tests/routes/health.test.js (1)
 ✓ tests/config/env.test.js (3)
 ✓ tests/plugins/errorHandler.test.js (3)
 ✓ tests/utils/password.test.js (3)
 ✓ tests/utils/jwt.test.js (6)
 ✓ tests/plugins/auth.test.js (5)
 ✓ tests/routes/auth.test.js (8)
 ✓ tests/routes/auth-reset.test.js (6)
 ✓ tests/routes/me.test.js (5)
 ✓ tests/routes/pets.test.js (10)
 ✓ tests/routes/health.routes.test.js (13)
 ✓ tests/routes/food.test.js (7)
 ✓ tests/routes/records.test.js (8)

 Test Files  13 passed (13)
 Tests       78 passed (78)
```

- [ ] **12.9** Commit

```bash
cd ~/Documents/petlife/petlife-backend
git add -A
git commit -m "feat(sp1): records CRUD with file upload and freemium gate

Paginated and filterable medical records. File upload to R2 with
mock fallback for dev/test. Freemium limit: 3 attachments per pet
on FREE plan. All 78 tests passing."
```

---

## Summary

| Task | What | Tests |
|------|------|-------|
| 1 | Project scaffolding, Fastify health check | 1 |
| 2 | Zod env config, error handler | 6 |
| 3 | Prisma schema (12 models, 7 enums), migration, seed | 0 (DB setup) |
| 4 | bcrypt password utils, JWT utils | 9 |
| 5 | Auth plugin, CORS, rate limit | 5 |
| 6 | Register, login, refresh, logout | 8 |
| 7 | Forgot + reset password | 6 |
| 8 | User profile (GET/PATCH/DELETE /me) | 5 |
| 9 | Pets CRUD + ownership + freemium limit | 10 |
| 10 | Vaccines, dewormings, medications, consultations | 13 |
| 11 | Food config, meals, weight + freemium gate | 7 |
| 12 | Records CRUD, file upload, freemium gate | 8 |
| **Total** | | **78 tests** |

### Endpoints Delivered

```
GET    /health
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
DELETE /auth/logout
POST   /auth/forgot
POST   /auth/reset
GET    /me
PATCH  /me
DELETE /me
GET    /pets
POST   /pets
GET    /pets/:petId
PATCH  /pets/:petId
DELETE /pets/:petId
GET    /pets/:petId/vaccines
POST   /pets/:petId/vaccines
PATCH  /pets/:petId/vaccines/:id
DELETE /pets/:petId/vaccines/:id
GET    /pets/:petId/dewormings
POST   /pets/:petId/dewormings
PATCH  /pets/:petId/dewormings/:id
DELETE /pets/:petId/dewormings/:id
GET    /pets/:petId/medications
POST   /pets/:petId/medications
PATCH  /pets/:petId/medications/:id
DELETE /pets/:petId/medications/:id
GET    /pets/:petId/consultations
POST   /pets/:petId/consultations
PATCH  /pets/:petId/consultations/:id
DELETE /pets/:petId/consultations/:id
GET    /pets/:petId/food
PATCH  /pets/:petId/food
GET    /pets/:petId/meals
POST   /pets/:petId/meals
GET    /pets/:petId/weight
POST   /pets/:petId/weight
GET    /pets/:petId/records
POST   /pets/:petId/records
PATCH  /pets/:petId/records/:id
DELETE /pets/:petId/records/:id
POST   /pets/:petId/records/:id/attachments
```
