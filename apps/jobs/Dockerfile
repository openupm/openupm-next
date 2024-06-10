######## Base ########
FROM node:18-alpine AS base

######## Builder ########
FROM base AS builder

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk update
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app
# Install turbo
RUN npm install -g turbo@1.13.4 rimraf
# Copy the project
COPY . .
# Clean and prune
RUN turbo run clean
RUN rm -rf out
RUN turbo prune @openupm/jobs --docker

######## Installer ########
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Add lockfile and package.json's of isolated subworkspace
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json

# First install dependencies (as they change less often)
RUN npm install

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json
RUN npm run build -- --filter=@openupm/jobs

# Re-install dependencies for the app, so that .bin links work for packages just built
WORKDIR /app/apps/jobs
RUN npm install

######## Runner ########
FROM base AS runner

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
