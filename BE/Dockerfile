# Use Node.js 18 alpine for a smaller image
FROM node:18-alpine

# Install build dependencies for native modules (bcrypt)
RUN apk add --no-cache python3 make g++

WORKDIR /usr/src/app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose the API port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
