FROM node:lts-alpine

COPY package*.json ./
RUN npm ci

COPY . .

ENTRYPOINT ["node", "dist/index.js"]