#!/usr/bin/env bash
set -euo pipefail # Exit on error, undefined var, or pipe failure

NAME="fitness" # LXD container name
YAML_ORIG="cloud-config.yaml" # Original cloud-config file
YAML_TMP="/tmp/cloud-config-rendered.yaml" # Temp rendered file

# Dynamic domain based on host
VM_HOSTNAME=$(hostname) # Get host machine's hostname
DOMAIN="${VM_HOSTNAME}.lrk.si" # Construct domain using hostname

echo "===================================================="
echo "   FITNESS APP DEPLOYMENT"
echo "   Domain: ${DOMAIN}"
echo "===================================================="
echo ""

echo "=== [1/7] Render cloud-config with domain ==="
sed "s/__DOMAIN__/${DOMAIN}/g" "$YAML_ORIG" > "$YAML_TMP" # Replace placeholder with actual domain

echo "=== [2/7] Delete old container if exists ==="
# Check if container exists
# If exists, stop and delete it
# Using --format csv for reliable parsing
if lxc list --format csv -c n | grep -q "^$NAME$"; then
    echo "Stopping and deleting old container..."
    lxc stop -f "$NAME" || true
    lxc delete -f "$NAME" || true
fi

echo "=== [3/7] Launch new LXD container with rendered cloud-init ==="
# Launch container with cloud-init user-data
lxc launch ubuntu:22.04 "$NAME" --config=user.user-data="$(cat $YAML_TMP)"

# Wait a bit for container to initialize
# Sleep added to avoid race conditions
echo "=== [4/7] Wait for container to get an IP ==="
sleep 2
while true; do
    IP=$(lxc list "$NAME" -c 4 --format csv | awk '{print $1}')
    if [[ -n "${IP}" ]]; then
        echo "Container IP: $IP"
        break
    fi
    sleep 2
done

echo "=== [5/7] Attach LXD proxy devices (80/443) ==="
# Remove old if exists
lxc config device remove "$NAME" proxy80 2>/dev/null || true
lxc config device remove "$NAME" proxy443 2>/dev/null || true

# Attach proxy devices
lxc config device add "$NAME" proxy80 proxy \
    listen=tcp:0.0.0.0:80 \
    connect=tcp:"$IP":80

lxc config device add "$NAME" proxy443 proxy \
    listen=tcp:0.0.0.0:443 \
    connect=tcp:"$IP":443

echo "Restarting nginx after proxy devices are attached..."
# Restart nginx to bind to the proxied ports
lxc exec "$NAME" -- systemctl restart nginx || true

echo "=== [6/7] Wait for cloud-init to finish inside container ==="
# Poll cloud-init status until done
# Using a loop with sleep
while true; do
    STATUS=$(lxc exec "$NAME" -- cloud-init status || true)
    echo "$STATUS"
    [[ "$STATUS" == *"done"* ]] && break
    sleep 3
done

echo "=== [7/7] Start Certbot timer + force initial run ==="
# Reload systemd to pick up new timer/service
lxc exec "$NAME" -- systemctl daemon-reload

echo "Enable timer"
# Enable and start the certbot-reliable timer
lxc exec "$NAME" -- systemctl enable --now certbot-reliable.timer

echo "Trigger first certbot attempt"
# Start the certbot-reliable service to attempt obtaining certs immediately
# Ignore failure here; timer will retry
lxc exec "$NAME" -- systemctl start certbot-reliable.service || \
    echo "⚠ Certbot service start failed (will retry via timer)"

echo ""
echo "=== Checking backend health ==="
# Check backend service status
# Show status and check if listening on port 3001
lxc exec "$NAME" -- systemctl status fitness-backend --no-pager || true
lxc exec "$NAME" -- ss -tlnp | grep 3001 || echo "⚠ Backend NOT listening on port 3001"

echo ""
echo "===================================================="
echo "  ✔ DEPLOYMENT COMPLETE!"
echo "  ✔ Website:    https://${DOMAIN}"
echo "  ✔ API:        https://${DOMAIN}/api/"
echo "  ✔ SSL:        Auto-retrying until success"
echo "===================================================="