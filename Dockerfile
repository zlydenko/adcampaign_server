FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY .env ./

RUN npm ci --only=production

COPY . .

RUN npm run build

ENV PORT=${PORT}
EXPOSE ${PORT}

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"] 