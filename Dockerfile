FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && apt-get clean && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/wcagify/package.json packages/wcagify/
COPY packages/create-wcagify/package.json packages/create-wcagify/
COPY playground/package.json playground/
COPY docs/package.json docs/

RUN pnpm install --frozen-lockfile --ignore-scripts && \
    cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && \
    (npx --yes prebuild-install || npx --yes node-gyp rebuild --release)

COPY . .

RUN pnpm --filter @focusring/wcagify build && pnpm --filter @wcagify/playground build

RUN addgroup --system appuser && adduser --system --ingroup appuser appuser && chown -R appuser:appuser /app

USER appuser

EXPOSE 3000
ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["node", "playground/.output/server/index.mjs"]
