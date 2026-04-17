#!/bin/sh
# init-certbot.sh
# Runs inside the certbot container.
# Issues the certificate if it doesn't exist yet, then writes the SSL nginx
# config to the shared volume so Nginx picks it up on its next reload cycle.

set -e

DOMAIN="${DOMAIN:?DOMAIN env var is required}"
EMAIL="${CERTBOT_EMAIL:?CERTBOT_EMAIL env var is required}"
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
WEBROOT="/var/www/certbot"
SSL_CONF_SRC="/etc/nginx/ssl-template/nginx-ssl.conf"
SSL_CONF_DEST="/etc/nginx/conf.d/default.conf"

echo "==> [certbot] Checking certificate for ${DOMAIN}..."

if [ -f "$CERT_PATH" ]; then
  echo "==> [certbot] Certificate already exists — ensuring SSL config is active..."
  if [ -f "$SSL_CONF_SRC" ]; then
    # Write SSL config to shared volume (Nginx will reload via its own timer)
    envsubst '${DOMAIN}' < "$SSL_CONF_SRC" > "$SSL_CONF_DEST"
    echo "==> [certbot] SSL config written to shared volume."
  fi
  exit 0
fi

echo "==> [certbot] No certificate found. Requesting from Let's Encrypt..."
echo "==> [certbot] DNS must already point ${DOMAIN} to this server's IP."

certbot certonly \
  --webroot \
  --webroot-path="${WEBROOT}" \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  --non-interactive \
  --domains "${DOMAIN}"

echo "==> [certbot] Certificate issued successfully."

if [ -f "$SSL_CONF_SRC" ]; then
  envsubst '${DOMAIN}' < "$SSL_CONF_SRC" > "$SSL_CONF_DEST"
  echo "==> [certbot] SSL config written. Nginx will reload on next cycle."
fi
