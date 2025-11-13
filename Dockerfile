# Etapa 1 - Build da aplicação
FROM node:lts-alpine3.22 AS builder

WORKDIR /modulo-cadastro

# Copiar apenas os arquivos necessários para instalar dependências
COPY package*.json tsconfig*.json ./

# Instalar todas dependências (inclusive dev)
RUN yarn install

# Copiar o restante do projeto
COPY . .

# Executar o build (gera a pasta build/)
RUN yarn build

# Etapa 2 - Imagem final para produção
FROM node:lts-alpine3.22

WORKDIR /modulo-cadastro

# Copiar apenas arquivos essenciais da etapa de build
COPY --from=builder /modulo-cadastro/package*.json ./
COPY --from=builder /modulo-cadastro/build ./build
COPY --from=builder /modulo-cadastro/node_modules ./node_modules

# Definir variáveis de ambiente para produção
ENV NODE_ENV=production

# Comando de inicialização (executa o JS transpilado)
CMD ["node", "build/server.js"]