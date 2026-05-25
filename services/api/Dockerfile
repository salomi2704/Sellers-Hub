FROM node:24-alpine

WORKDIR /workspace/services/api

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run prisma:generate

EXPOSE 3000
CMD ["sh", "-c", "npm run prisma:migrate && npm run start:dev"]
