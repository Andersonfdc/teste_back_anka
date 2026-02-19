# ----- Stage 1: install dependencies -----
FROM public.ecr.aws/docker/library/node:22.16.0 AS deps
WORKDIR /app

# Only copy manifests to leverage Docker layer cache
COPY package*.json ./
RUN npm ci

# ----- Stage 2: build (ts only) -----
FROM deps AS build
WORKDIR /app

# Copy only what is necessary to build the app
COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src
COPY scripts ./scripts

# Build application
RUN npm run build

# ----- Stage 3: runtime -----
FROM public.ecr.aws/docker/library/node:22.16.0-slim AS runtime
WORKDIR /app

# Install tools required by entrypoint (bash + PostgreSQL client)
RUN apt-get update \
  && apt-get install -y --no-install-recommends bash postgresql-client \
  && rm -rf /var/lib/apt/lists/*

# Copy minimal runtime artifacts
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY prisma ./prisma
COPY scripts ./scripts

# Entrypoint to run Prisma migrate deploy at startup
COPY scripts/prisma-migrate-deploy-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3333
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["npm", "run", "start:prod"]
