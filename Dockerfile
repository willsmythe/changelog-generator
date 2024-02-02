FROM node:lts-alpine

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

ENTRYPOINT ["node", "dist/index.js"]