# ==============================================================================
# Stage 1: Build & Dependencies
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Install all dependencies (development + production)
RUN npm ci || npm install

COPY . .

# ==============================================================================
# Stage 2: Production Release Runner
# ==============================================================================
FROM node:22-alpine AS production

WORKDIR /usr/src/app

# Re-declare build arguments inside production stage
ARG APP_RELEASE=1.0.0
ARG BUILD_DATE=unknown

ENV RELEASE_VERSION=$APP_RELEASE
ENV BUILD_DATE=$BUILD_DATE
ENV NODE_ENV=production

# Copy package descriptors with non-root ownership
COPY --chown=node:node package*.json ./

# Install ONLY production dependencies and clear npm cache
RUN (npm ci --only=production || npm install --only=production) && npm cache clean --force

# Copy application source files from builder stage
COPY --chown=node:node --from=builder /usr/src/app/src ./src
COPY --chown=node:node --from=builder /usr/src/app/index.js ./index.js

# Switch to non-root node user
USER node

EXPOSE 5000

CMD ["node", "index.js"]
