# Use the official Node.js LTS image
FROM node:20-alpine

WORKDIR /app

# Copy package.json (or yarn.lock)
COPY . .

# Install dependencies and build
RUN npm install
RUN npm run build

# Expose the port Next.js will run on
EXPOSE 3002

# Start the Next.js server
CMD ["npm", "run", "start"]
