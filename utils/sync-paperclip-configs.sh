#!/usr/bin/env bash
# Syncs local LLM tool configs into the paperclip pod's persistent volume.
# Run manually whenever you update your local models.json or opencode.json.
set -euo pipefail

POD=$(kubectl get pod -n paperclip -l app.kubernetes.io/name=paperclip -o jsonpath='{.items[0].metadata.name}')
echo "Target pod: $POD"

kubectl exec -n paperclip "$POD" -- mkdir -p /paperclip/.pi/agent /paperclip/.config/opencode

kubectl cp ~/.pi/agent/models.json          "paperclip/$POD:/paperclip/.pi/agent/models.json"
kubectl cp ~/.config/opencode/opencode.json "paperclip/$POD:/paperclip/.config/opencode/opencode.json"

# kubectl cp preserves the local UID/GID, leaving files unreadable by the
# node user (uid=1000) that paperclip uses to spawn pi. Fix ownership here.
kubectl exec -n paperclip "$POD" -- chown node:node \
  /paperclip/.pi/agent/models.json \
  /paperclip/.config/opencode/opencode.json

echo "Installing pi..."
kubectl exec -n paperclip "$POD" -- npm install -g @earendil-works/pi-coding-agent

echo "✓ Done"
