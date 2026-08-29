FROM node:22-alpine

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

COPY --chown=node:node src/ ./src/

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

USER node

CMD ["node", "src/gateway.js"]
