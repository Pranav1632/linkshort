FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --only=production && npm cache clean --force

COPY src/ ./src/

USER node

CMD ["node", "src/worker.js"]
