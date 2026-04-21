FROM node:22-slim AS base
RUN npm install -g pnpm@9.15.0

WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY packages/sdk/package.json packages/sdk/
COPY apps/api/package.json apps/api/
COPY apps/dashboard/package.json apps/dashboard/
COPY apps/mcp-server/package.json apps/mcp-server/

RUN pnpm install --frozen-lockfile --prod=false

COPY packages/shared/ packages/shared/
COPY packages/db/ packages/db/
COPY apps/api/ apps/api/

FROM node:22-slim AS runner
RUN npm install -g pnpm@9.15.0
WORKDIR /app

COPY --from=base /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml /app/turbo.json ./
COPY --from=base /app/packages/shared/ packages/shared/
COPY --from=base /app/packages/db/ packages/db/
COPY --from=base /app/apps/api/ apps/api/

RUN pnpm install --frozen-lockfile --prod=false

ENV PORT=8080
EXPOSE 8080

CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]
