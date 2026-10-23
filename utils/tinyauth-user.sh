#!/usr/bin/env bash
# Usage: tinyauth-user.sh <username> <email>
# Adds or replaces a tinyauth user (password + TOTP) in the sealed secret
# tinyauth/tinyauth-users. The password is prompted (no echo) and hashed
# locally; nothing secret is written to disk unencrypted or shell history.
# Other users already in the cluster secret are kept.
#
# Shows a QR code if `qrencode` is installed (brew install qrencode),
# otherwise an otpauth:// link to paste into an authenticator app.
# Apply afterwards with:
#   helmfile -l name=sealed-secrets-manifests --skip-deps sync
#   kubectl -n tinyauth rollout restart deploy/tinyauth
set -euo pipefail

NAMESPACE=tinyauth
SECRET_NAME=tinyauth-users
OUTPUT="$(cd "$(dirname "$0")/.." && pwd)/k3s/charts/sealed-secrets-manifests/templates/tinyauth-users.yaml"

[[ $# -eq 2 ]] || { echo "Usage: $0 <username> <email>"; exit 1; }
user="$1"
email="$2"
[[ "$user" =~ ^[a-z0-9]+$ ]] || { echo "Username must be lowercase letters/digits"; exit 1; }

read -rsp "Password for $user: " pw </dev/tty; echo ""
read -rsp "Repeat password: " pw2 </dev/tty; echo ""
[[ "$pw" == "$pw2" && -n "$pw" ]] || { echo "Passwords don't match"; exit 1; }
# htpasswd emits $2y$; tinyauth's Go bcrypt expects $2a$ (same algorithm).
hash="$(printf '%s' "$pw" | htpasswd -niBC 12 "$user" | cut -d: -f2- | sed 's/^\$2y\$/$2a$/')"
unset pw pw2

totp="$(python3 -c 'import base64, os; print(base64.b32encode(os.urandom(20)).decode().rstrip("="))')"
uri="otpauth://totp/Tinyauth:${user}?secret=${totp}&issuer=Tinyauth"
echo ""
echo "Add this to the authenticator app for $user:"
if command -v qrencode >/dev/null; then
  qrencode -t ansiutf8 "$uri"
else
  echo "$uri"
fi
read -rp "Enter the 6-digit code it shows now: " code </dev/tty
python3 - "$totp" "$code" <<'PY' || { echo "Code doesn't match; nothing changed"; exit 1; }
import base64, hmac, struct, sys, time
secret, code = sys.argv[1], sys.argv[2].strip()
key = base64.b32decode(secret + "=" * (-len(secret) % 8))
def at(t):
    h = hmac.new(key, struct.pack(">Q", t // 30), "sha1").digest()
    o = h[-1] & 15
    return "%06d" % ((struct.unpack(">I", h[o:o + 4])[0] & 0x7FFFFFFF) % 10**6)
now = int(time.time())
sys.exit(0 if code in (at(now - 30), at(now), at(now + 30)) else 1)
PY

# Merge with the users already in the cluster, replacing this one.
current="$(kubectl -n "$NAMESPACE" get secret "$SECRET_NAME" -o json 2>/dev/null || echo '{"data":{}}')"
others="$(jq -r '.data.users // "" | @base64d' <<<"$current" | tr ',' '\n' | grep -v "^${user}:" | grep . || true)"
users="$(printf '%s\n%s\n' "$others" "${user}:${hash}:${totp}" | grep . | paste -sd, -)"

args=(--from-literal="users=$users" --from-literal="${user}-email=$email")
while IFS=$'\t' read -r key value; do
  args+=(--from-literal="${key}=${value}")
done < <(jq -r --arg k "${user}-email" '.data // {} | to_entries[]
  | select(.key | endswith("-email")) | select(.key != $k)
  | "\(.key)\t\(.value | @base64d)"' <<<"$current")

kubectl create secret generic "$SECRET_NAME" \
  --namespace "$NAMESPACE" \
  "${args[@]}" \
  --dry-run=client -o yaml \
| kubeseal --format yaml \
    --controller-name=sealed-secrets \
    --controller-namespace=kube-system \
  > "$OUTPUT"

echo "✓ $user saved to $OUTPUT ($(tr ',' '\n' <<<"$users" | wc -l | tr -d ' ') user(s) total)"
