FROM node:24-alpine

WORKDIR /workspace/apps/frontend

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 4173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "4173"]
