# Use a Node.js base image
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Use a smaller image for production
FROM node:18-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY .env .env

# Expose port 8080 for Google Cloud Run
EXPOSE 8080  

CMD ["node", "dist/main"]
