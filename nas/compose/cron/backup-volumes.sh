#!/bin/bash

restic backup /mnt/docker-volumes \
    --repo "${RESTIC_REPOSITORY}" \
    --tag docker-volumes \
    --exclude="*.tmp" \
    --exclude="**/cache/**" \
    --password-command "echo ${RESTIC_PASSWORD}" \
    --cache-dir /cache \
    --dry-run
