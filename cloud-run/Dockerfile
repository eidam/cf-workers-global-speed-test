FROM node:alpine

WORKDIR /app

COPY package.json /app
RUN yarn 

COPY server.js /app

CMD ["node", "/app/server.js"]
