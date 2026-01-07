# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies first
COPY package.json package-lock.json* ./
RUN npm ci || npm install --production

# Copy source
COPY . .

EXPOSE 3001
CMD ["node", "index.js"]
