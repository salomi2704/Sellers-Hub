FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends netcat-openbsd openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run prisma:generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
