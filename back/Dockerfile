FROM node:22-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY . .

RUN pnpm i --frozen-lockfile
RUN pnpm run build

EXPOSE 3000
CMD ["pnpm", "start"]
