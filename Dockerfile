# ─── Stage 1: Build ───
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Stage 2: Serve ───
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Railway uses PORT env var
ENV PORT=3000
EXPOSE 3000

# Substitute PORT at runtime and start nginx
CMD sh -c "sed -i 's/listen 3000/listen ${PORT}/' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
