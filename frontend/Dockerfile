FROM node:22-alpine AS runner

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

RUN npm install --legacy-peer-deps

COPY --chown=node:node . ./

ENV NODE_ENV=development
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "dev"]
