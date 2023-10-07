#!/bin/bash

restic forget \
    --keep-last 5 \
    --keep-monthly 2 \
    --repo "${RESTIC_REPOSITORY}" \
    --password-command "echo ${RESTIC_PASSWORD}" \
    --prune \
    --cache-dir /cache
