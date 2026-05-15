#!/usr/bin/env bash
# Usage: seal-secret.sh -n <namespace> -s <secret-name> -o <output-file> key [key ...]
# For each key, prompts interactively (no echo, not stored in history).
# Leave value empty to auto-generate a random hex string.
set -euo pipefail

usage() {
  echo "Usage: $0 -n <namespace> -s <secret-name> -o <output-file> key [key ...]"
  echo "  Leave a value empty when prompted to auto-generate a random secret."
  exit 1
}

NAMESPACE=""
SECRET_NAME=""
OUTPUT=""

while getopts "n:s:o:" opt; do
  case $opt in
    n) NAMESPACE="$OPTARG" ;;
    s) SECRET_NAME="$OPTARG" ;;
    o) OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done
shift $((OPTIND - 1))

[[ -z "$NAMESPACE" || -z "$SECRET_NAME" || -z "$OUTPUT" || $# -eq 0 ]] && usage

LITERAL_ARGS=()
for key in "$@"; do
  read -rsp "Value for '$key' (empty to auto-generate): " value </dev/tty
  echo ""
  if [[ -z "$value" ]]; then
    value="$(openssl rand -hex 32)"
    echo "  → auto-generated"
  fi
  LITERAL_ARGS+=(--from-literal="$key=$value")
done

kubectl create secret generic "$SECRET_NAME" \
  --namespace "$NAMESPACE" \
  "${LITERAL_ARGS[@]}" \
  --dry-run=client -o yaml \
| kubeseal --format yaml \
    --controller-name=sealed-secrets \
    --controller-namespace=kube-system \
  > "$OUTPUT"

echo "✓ Sealed secret written to $OUTPUT"
