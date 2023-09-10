FROM node:18-alpine

WORKDIR /app

COPY ./.output ./

ENTRYPOINT [ "node", "server/index.mjs" ]