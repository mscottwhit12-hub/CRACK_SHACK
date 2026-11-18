#!/bin/sh
# Starts as root only long enough to make the data folder writable, then runs the app as the unprivileged "node" user.
set -e
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DATA_DIR"
  chown -R node:node "$DATA_DIR" 2>/dev/null || echo "warning: could not take ownership of $DATA_DIR"
  exec su-exec node "$@"
fi
exec "$@"
