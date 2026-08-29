# ==============================================================================
# Stage 1: Build & Dependencies
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

# Install dependencies with legacy-peer-deps to avoid optional peer conflicts
RUN npm install --legacy-peer-deps

COPY --chown=node:node . .

# ==============================================================================
# Stage 2: Production Release Runner
# ==============================================================================
FROM node:22-alpine AS production

WORKDIR /usr/src/app

ARG APP_RELEASE=1.0.0
ARG BUILD_DATE=unknown

ENV RELEASE_VERSION=$APP_RELEASE
ENV BUILD_DATE=$BUILD_DATE
ENV NODE_ENV=production

COPY --chown=node:node package*.json ./

# Install ONLY production dependencies
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy application source files from builder stage
COPY --chown=node:node --from=builder /usr/src/app/src ./src
COPY --chown=node:node --from=builder /usr/src/app/index.js ./index.js

# Switch to non-root node user
USER node

EXPOSE 5000

CMD ["node", "index.js"]
