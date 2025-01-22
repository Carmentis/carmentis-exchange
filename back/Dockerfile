
# Use official Node.js 20 image as the base image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package*.json and package-lock.json (if present)
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application source code to the working directory
COPY . .



# Expose the default application port
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "start"]