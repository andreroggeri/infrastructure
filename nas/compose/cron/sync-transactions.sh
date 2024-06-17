#!/bin/bash
xvfb-run brbanks2ynab sync --config $SYNC_CONFIG --ntfy-topic $SYNC_TOPIC
