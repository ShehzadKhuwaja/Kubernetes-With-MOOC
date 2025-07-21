# Use the Alpine variant of Node.js (lightweight)
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install

# Copy app code
COPY . .

# Start the application
CMD ["node", "app.js"]
