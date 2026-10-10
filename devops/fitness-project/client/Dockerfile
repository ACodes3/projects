# syntax=docker/dockerfile:1.7

############################
# Build stage
############################
FROM node:20-alpine AS builder
WORKDIR /client

# Copy dependency files FIRST (cache-friendly)
COPY package*.json ./
RUN npm ci

# Copy rest of source
COPY . .

# Build
RUN npm run build

############################
# Runtime stage (minimal)
############################
FROM nginx:1.26-alpine

# Remove default nginx assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build output
COPY --from=builder /client/dist /usr/share/nginx/html

# Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
