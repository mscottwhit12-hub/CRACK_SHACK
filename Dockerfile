# Crack Shack as a web app: one shared layout for every browser that opens it.
FROM node:20-alpine
WORKDIR /srv
COPY server/ ./server/
COPY app/ ./app/
ENV PORT=8080 APP_DIR=/srv/app DATA_DIR=/data NODE_ENV=production
RUN mkdir -p /data && chown node:node /data
VOLUME /data
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1
CMD ["node", "server/server.js"]
