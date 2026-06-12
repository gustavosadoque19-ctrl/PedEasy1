FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache chromium
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
EXPOSE 3001
CMD ["node", "src/index.js"]
