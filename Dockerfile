# Node com major fixo: a tag lts muda de versão sozinha
FROM node:24-alpine3.22 AS builder
WORKDIR /modulo-cadastro
COPY package.json yarn.lock tsconfig.json ./
RUN yarn install --frozen-lockfile
COPY src ./src
RUN yarn build

# Só dependências de produção na imagem final
FROM node:24-alpine3.22 AS deps
WORKDIR /modulo-cadastro
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

FROM node:24-alpine3.22
WORKDIR /modulo-cadastro
ENV NODE_ENV=production
COPY --from=deps /modulo-cadastro/node_modules ./node_modules
COPY --from=builder /modulo-cadastro/build ./build
COPY package.json ./
USER node
CMD ["node", "build/server.js"]
