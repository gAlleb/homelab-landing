FROM node:22-alpine
RUN apk add --no-cache iputils
WORKDIR /app
COPY server.js .
EXPOSE 3001
CMD ["node", "server.js"]
