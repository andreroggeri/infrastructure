# Backups

What gets backed up, where it goes, and what is deliberately skipped.

> **Status (2026-10-21):** Longhorn backups to B2 are live. NAS restic backups
> have been **failing since 2025-05-21** (see "NAS files" below). The newest
> restic snapshot in B2 is from that date.

## Where backups go

Everything goes to the same Backblaze B2 bucket (S3 endpoint), one prefix per tool:

Bucket `roggeri-nas-backups`, region `us-east-005`.

| Tool | What | Prefix |
|---|---|---|
| Longhorn | k3s volumes (app config, databases) | `longhorn/` |
| restic (NAS `cron` stack) | Files on the NAS | bucket root |

Longhorn uses the same B2 key as restic, stored as the sealed secret
`longhorn-system/longhorn-b2` (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`AWS_ENDPOINTS`).

The bucket's lifecycle rule must be **"Keep only the last version of the file"**.
B2 keeps every old version by default, so pruned backups would otherwise keep
being billed forever.

Snapshots and Longhorn replicas are not backups. They sit on the same hardware
and do not survive a bad upgrade, a deleted volume, or the house losing power.

## k3s volumes (Longhorn)

Nightly backup at 03:00 São Paulo (06:00 UTC), keep the last 14. The job is
`nightly-backup` in `k3s/charts/storage-classes`.

A volume is included by labelling its Longhorn volume. The label lives on the
cluster, not in git, so a recreated PVC must be labelled again:

```sh
pv=$(kubectl -n <namespace> get pvc <pvc> -o jsonpath='{.spec.volumeName}')
kubectl -n longhorn-system label volumes.longhorn.io "$pv" \
  recurring-job-group.longhorn.io/backup=enabled
```

List what is currently included:

```sh
kubectl -n longhorn-system get volumes.longhorn.io \
  -l recurring-job-group.longhorn.io/backup=enabled
```

Databases are backed up as plain Longhorn volumes. A restore looks to Postgres
like recovering from a power cut, which it handles. Native CNPG backups would add
a second system for little gain at this size.

### Backed up

| Namespace | Volume | Why |
|---|---|---|
| home-assistant | `home-assistant-home-assistant-0` | All HA config, automations, history |
| home-assistant | `data-volume-zigbee2mqtt-0` | Zigbee network state. Losing it means re-pairing every device |
| authentik | `data-authentik-postgresql-0` | Users, SSO apps, flows |
| n8n | `n8n` | Data dir, including the patched `hooks.js` for authentik SSO |
| n8n | `db-1` | Workflows and credentials |
| evolution-api | `evolution-db-1` | WhatsApp sessions and data |
| actual-budget | `actual-budget-actualbudget-data` | Budget data |
| memos | `memos` | Notes |
| open-webui | `open-webui` | Chats and settings |
| uptime-kuma | `uptime-kuma-pvc` | Monitors and history |
| garage | `data-garage-0`, `meta-garage-0` | Objects stored in Garage |

About 5 GiB of real data in total (2026-10-21).

### Skipped

| Namespace | Volume | Why |
|---|---|---|
| mixuruca | `mixuruca-data` | Paused, and ~20 GiB. Revisit if Mixuruca is resumed |
| registry | `registry-data` | Images can be rebuilt from source |
| kube-system | `traefik` | Only TLS certificates, which get re-issued |
| home-assistant | `mosquitto` | Only retained MQTT messages. Devices republish them |
| authentik | `redis-data-authentik-redis-master-0` | Unused. Current authentik no longer uses Redis |
| actual-budget | `actual-http-api` | Cache, rebuilt from actual-budget |
| apprise | `apprise` | Small config, easy to recreate |
| open-webui | `open-webui-pipelines` | Nothing stored there |

## NAS files (restic)

restic is set up to back up `/var/lib/docker/volumes` (a symlink to
`/data/docker/lib`) and `/archive/data/nas/immich`.

Why it broke: `runitor-restic` is built locally (`pull_policy: build`), not
pulled. Docker's data root moved to `/data/docker/lib` around 2025-05-23, the
local image was lost, and ofelia cannot pull it from any registry.
As apps move from Docker Compose to k3s, their Docker volumes go away and are
covered by Longhorn instead. restic should then only cover irreplaceable files
under `/archive`:

| Backed up | Skipped |
|---|---|
| Immich photos | Movies and TV (`/archive/media`): can be re-downloaded |
| Paperless documents | Torrents and downloads |
| | Frigate recordings: short-lived by design |

## Known gaps

- Backup check-ins go to the self-hosted healthchecks. If restic and
  healthchecks both run in k3s, a cluster outage stops backups and the alert
  about them at the same time. Fix: ping hosted healthchecks.io for backup jobs.

## Adding a new app

When adding an app to k3s, decide which list its volumes go in and update this
file. If backed up, add the volume to the `backup` recurring-job group.
