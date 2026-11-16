# Crack Shack as a web app: one shared layout for every browser that opens it.
FROM node:20-alpine
RUN apk add --no-cache su-exec
WORKDIR /srv
COPY server/ ./server/
COPY app/ ./app/
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENV PORT=8080 APP_DIR=/srv/app DATA_DIR=/data NODE_ENV=production
VOLUME /data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server/server.js"]
