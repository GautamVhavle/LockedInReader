FROM node:22-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages ./packages
COPY services/api ./services/api
RUN pnpm install --frozen-lockfile || pnpm install
WORKDIR /app/services/api
RUN pnpm build
EXPOSE 8787
CMD ["node", "dist/index.js"]
