######## Base ########
FROM node:22-alpine AS base

######## Builder ########
FROM base AS builder

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk update
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app
# Install turbo
RUN npm install -g turbo@2.8.13 rimraf
# Copy the project
COPY . .
# Clean and prune
RUN turbo run clean
RUN rm -rf out
RUN turbo prune @openupm/jobs --docker
RUN cp -R tooling out/tooling

######## Installer ########
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy pruned workspace
COPY --from=builder /app/out/ ./

# Install dependencies
RUN npm install

# Build the project and its dependencies
RUN npm run build -- --filter=@openupm/jobs

# Re-install dependencies for the app, so that .bin links work for packages just built
WORKDIR /app/apps/jobs
RUN npm install

######## Runner ########
FROM base AS runner
LABEL service="upm-jobs"

# Don't run production as root
RUN addgroup --system --gid 1001 runner
RUN adduser --system --uid 1001 runner
USER runner

# Copy /app from installer
WORKDIR /app
COPY --from=installer --chown=runner:runner /app .

# Run node
WORKDIR /app/apps/jobs
CMD node build/index.js
