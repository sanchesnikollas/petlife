# PetLife — Guia de Deploy Escalável

## Arquitetura

```
Vercel (frontend CDN) ──→ Railway (API) ──→ Supabase (PostgreSQL)
                          Railway (Worker) ──↗
                          R2 (Storage) ←── API
                          FCM (Push) ←── Worker
```

---

## Passo 1: Criar banco Supabase

1. Ir em https://supabase.com → criar conta → New Project
2. Nome: `petlife` | Senha do DB: gerar senha forte | Região: East US
3. Após criação, ir em **Settings → Database**
4. Copiar **Connection string (Transaction pooler - port 6543)** → será `DATABASE_URL`
5. Copiar **Connection string (Session pooler - port 5432)** → será `DIRECT_URL`

## Passo 2: Rodar migrations no Supabase

```bash
cd petlife-backend

# Temporariamente setar as URLs do Supabase
export DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
export DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Rodar migrations
npx prisma migrate deploy

# Seed (test user + food brands + groups)
node prisma/seed.js
```

## Passo 3: Deploy Backend no Railway

```bash
# No projeto Railway (https://railway.com/project/aacea463-...)
# Criar service "petlife-api":

# Via Railway CLI:
railway login
railway link --project aacea463-1b41-471f-b2a7-a88915b98ee8

# Configurar para usar petlife-backend/
# No dashboard Railway:
# 1. New Service → GitHub repo → root directory: petlife-backend
# 2. Ou: Deploy from Dockerfile → petlife-backend/Dockerfile

# Env vars necessárias (Railway dashboard → Variables):
DATABASE_URL=postgresql://postgres.[ref]:[pass]@...pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[ref]:[pass]@...pooler.supabase.com:5432/postgres
JWT_SECRET=<gerar: openssl rand -hex 32>
JWT_REFRESH_SECRET=<gerar: openssl rand -hex 32>
FRONTEND_URL=https://petlife-web.vercel.app
NODE_ENV=production
PORT=3001
# Opcional (ativar quando configurar):
# R2_ACCOUNT_ID=...
# R2_ACCESS_KEY_ID=...
# R2_SECRET_ACCESS_KEY=...
# R2_BUCKET_NAME=petlife-uploads
# RESEND_API_KEY=...
# FCM_SERVICE_ACCOUNT_JSON=...
```

## Passo 4: Deploy Worker no Railway

```bash
# No mesmo projeto Railway:
# 1. New Service → GitHub repo → root directory: petlife-backend
# 2. Custom Dockerfile: Dockerfile.worker
# 3. Mesmas env vars do API (copiar)
# OU via Railway CLI:
# railway service create petlife-worker
```

O worker NÃO expõe porta HTTP — é um processo background puro (push scheduler + cleanup jobs).

## Passo 5: Deploy Frontend no Vercel

```bash
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Na raiz do projeto (onde está vercel.json)
cd /Users/nikollasanches/Documents/Petlife
vercel

# Configurar:
# Framework: Vite
# Build: npm run build
# Output: dist
# Env var: VITE_API_URL = https://petlife-api-xxxxx.up.railway.app
```

**Ou pelo dashboard Vercel:**
1. https://vercel.com → Import Git Repository → sanchesnikollas/petlife
2. Framework: Vite
3. Root Directory: `.` (raiz)
4. Environment Variables:
   - `VITE_API_URL` = URL do backend Railway
   - `VITE_APP_NAME` = PetLife
   - `VITE_APP_VERSION` = 1.0.0

## Passo 6: Atualizar CORS

Após o deploy do frontend, copiar a URL do Vercel (ex: `https://petlife-web.vercel.app`) e:
1. Atualizar `FRONTEND_URL` no Railway (API + Worker)
2. Redeploy API

## Passo 7: Verificar

```bash
# Testar API
curl https://petlife-api-xxxxx.up.railway.app/health

# Testar frontend
# Abrir URL do Vercel → Login → test@petlife.com / senha123

# Testar food brands
curl https://petlife-api-xxxxx.up.railway.app/food-brands?q=royal -H "Authorization: Bearer <token>"
```

---

## Troubleshooting

**CORS error**: FRONTEND_URL no Railway não bate com URL do Vercel → atualizar e redeploy.

**Database connection refused**: Verificar se DATABASE_URL usa porta 6543 (pooler) e tem `?pgbouncer=true`.

**Migrations falham**: Usar DIRECT_URL (porta 5432) para migrations. Prisma faz isso automaticamente via `directUrl` no schema.

**Worker não roda**: Verificar que Dockerfile.worker é selecionado, não o Dockerfile padrão.

---

## Custos estimados

| Serviço | Plano | Custo |
|---------|-------|-------|
| Vercel | Hobby | Grátis |
| Railway (API) | Starter | ~$5/mês |
| Railway (Worker) | Starter | ~$2/mês (baixo CPU) |
| Supabase | Free | Grátis (500MB) |
| **Total** | | **~$7/mês** |
