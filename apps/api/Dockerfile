FROM node:22-slim AS base
RUN npm install -g pnpm@9.15.0

WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY apps/api/package.json apps/api/

RUN pnpm install --frozen-lockfile --prod=false

COPY packages/shared/ packages/shared/
COPY packages/db/ packages/db/
COPY apps/api/ apps/api/

RUN pnpm --filter @forgeid/api build

FROM node:22-slim AS runner
RUN npm install -g pnpm@9.15.0
WORKDIR /app

COPY --from=base /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=base /app/packages/shared/package.json packages/shared/
COPY --from=base /app/packages/shared/src packages/shared/src/
COPY --from=base /app/packages/db/package.json packages/db/
COPY --from=base /app/packages/db/src packages/db/src/
COPY --from=base /app/apps/api/package.json apps/api/
COPY --from=base /app/apps/api/dist apps/api/dist/
COPY --from=base /app/apps/api/src apps/api/src/

RUN pnpm install --frozen-lockfile --prod=false

ENV PORT=8080
EXPOSE 8080

CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]
