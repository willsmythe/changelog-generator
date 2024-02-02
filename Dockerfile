FROM node:lts-alpine

COPY package*.json ./
RUN npm ci

COPY . .

ENTRYPOINT ["npx", "ts-node", "src/index.ts"]