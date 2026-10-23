FROM node:22-alpine

WORKDIR /app

COPY ./.output ./

ENTRYPOINT [ "node", "server/index.mjs" ]