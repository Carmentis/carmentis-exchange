FROM node:22-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Copy package.json (or yarn.lock)
COPY . .

# Install dependencies and build
RUN pnpm install --frozen-lockfile


# Start the Next.js server
CMD ["sh", "/app/start.sh"]
