FROM node:lts-alpine

COPY package*.json ./
RUN npm ci
RUN npm run build

COPY . .

ENTRYPOINT ["node", "dist/index.js"]