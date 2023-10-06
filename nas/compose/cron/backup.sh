#!/bin/bash

# Docker volumes

echo "Backup docker volumes"
restic backup /mnt/docker-volumes \
    --repo "${RESTIC_REPOSITORY}" \
    --tag docker-volumes \
    --exclude="*.tmp" \
    --exclude="**/cache/**" \
    --exclude="**/immich_immich_model_cache/**" \
    --ignore-inode \
    --cache-dir /cache

# Immich data
echo "Backup immich data"
restic backup /mnt/immich \
    --repo "${RESTIC_REPOSITORY}" \
    --tag images \
    --exclude="*.tmp" \
    --exclude="**/cache/**" \
    --exclude="**/immich_immich_model_cache/**" \
    --ignore-inode \
    --cache-dir /cache
