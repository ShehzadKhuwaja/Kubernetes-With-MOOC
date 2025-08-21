# Use Node.js LTS as the base image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the app
COPY . .

# Expose the port your app runs on
EXPOSE 3001

# Start the backend
CMD ["node", "server.js"]