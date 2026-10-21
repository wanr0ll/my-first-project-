FROM node:20-alpine

WORKDIR /app

# Install dependencies first for Docker layer caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads/receipts logs

# Render / Railway dynamic port support
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
