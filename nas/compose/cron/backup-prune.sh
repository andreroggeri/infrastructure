#!/bin/bash

sleep 120 # Wait for backup to finish

restic forget \
    --keep-last 5 \
    --keep-monthly 2 \
    --repo "${RESTIC_REPOSITORY}" \
    --password-command "echo ${RESTIC_PASSWORD}" \
    --prune \
    --ignore-inode \
    --cache-dir /cache
