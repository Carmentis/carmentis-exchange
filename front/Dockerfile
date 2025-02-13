# Use the official Node.js LTS image
FROM node:20-alpine

WORKDIR /app

# Copy package.json (or yarn.lock)
COPY . .

# Install dependencies and build
RUN npm install


# Start the Next.js server
CMD ["sh", "/app/start.sh"]
