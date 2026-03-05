######## Base ########
FROM node:22-alpine AS base

######## Builder ########
FROM base AS builder
ARG TURBO_VERSION=2.8.13

RUN apk update
RUN apk add --no-cache libc6-compat

WORKDIR /app
RUN npm install -g turbo@${TURBO_VERSION} rimraf
COPY . .
RUN turbo run clean
RUN rm -rf out
RUN turbo prune @openupm/queue --docker
RUN cp -R tooling out/tooling

######## Installer ########
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=builder /app/out/json/package.json ./package.json
COPY --from=builder /app/out/json/package-lock.json ./package-lock.json
COPY --from=builder /app/out/full/apps ./apps
COPY --from=builder /app/out/full/packages ./packages
COPY --from=builder /app/out/full/turbo.json ./turbo.json
COPY --from=builder /app/out/tooling ./tooling

RUN npm install
RUN npm run build -- --filter=@openupm/queue

WORKDIR /app/apps/queue
RUN npm install

######## Runner ########
FROM base AS runner
LABEL service="upm-queue"

RUN addgroup --system --gid 1001 runner
RUN adduser --system --uid 1001 runner
USER runner

WORKDIR /app
COPY --from=installer --chown=runner:runner /app .

WORKDIR /app/apps/queue
CMD node build/index.js
