FROM node:20-alpine

WORKDIR /app

COPY ./.output ./

ENTRYPOINT [ "node", "server/index.mjs" ]