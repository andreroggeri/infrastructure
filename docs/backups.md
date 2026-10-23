# Backups

What gets backed up, where it goes, and what is deliberately skipped.

> **Status (2026-10-21):** Longhorn and restic backups to B2 are both live and
> have one successful run each. restic now runs in k3s; the NAS job had been
> broken since 2025-05-21 (see "History" below).

## Where backups go

Everything goes to the same Backblaze B2 bucket (S3 endpoint), one prefix per tool:

Bucket `roggeri-nas-backups`, region `us-east-005`.

| Tool | What | Prefix |
|---|---|---|
| Longhorn | k3s volumes (app config, databases) | `longhorn/` |
| restic (k3s `restic` release) | Files on the NAS host | bucket root |

Both use the same B2 key, stored as sealed secrets:
`longhorn-system/longhorn-b2` (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
`AWS_ENDPOINTS`) and `restic/restic-b2` (the same plus `RESTIC_REPOSITORY`,
`RESTIC_PASSWORD`).

The bucket's lifecycle rule is "Keep prior versions for 5 days". Deleted and
pruned files stay recoverable for 5 days, then stop being billed. Don't switch
it to "Keep all versions": pruned backups would then be billed forever.

Snapshots and Longhorn replicas are not backups. They sit on the same hardware
and do not survive a bad upgrade, a deleted volume, or the house losing power.

## k3s volumes (Longhorn)

Nightly backup at 03:00 São Paulo (06:00 UTC), keep the last 14. The job is
`nightly-backup` in `k3s/charts/storage-classes`.

A volume is only backed up, and only watched by the `backup-check` alert, if it
is in the `backup` group. A volume that was never added gets no backup and no
alert, so **check every new app's volumes land in the group.**

Preferred: label the PVC in the chart. Longhorn copies the labels to the volume
and the setting lives in git (see `k3s/charts/paperless`):

```yaml
labels:
  recurring-job.longhorn.io/source: enabled
  recurring-job-group.longhorn.io/backup: enabled
```

For a CNPG database, put the same labels under the Cluster's
`spec.inheritedMetadata.labels`.

Older volumes were labelled by hand on the Longhorn volume instead. That label
lives only on the cluster, so a recreated PVC must be labelled again:

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
| uptime-kuma | `uptime-kuma-pvc` | Monitors and history |
| garage | `data-garage-0`, `meta-garage-0` | Objects stored in Garage |
| paperless | `paperless-media`, `paperless-data`, `db-1` | Documents, search index, database. Labelled via the chart |
| tinyauth | `tinyauth-data` | Sessions and the OIDC signing keys. Losing the keys logs everyone out of every app |

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

## NAS files (restic)

Two CronJobs in the `restic` namespace (`k3s/charts/restic`), pinned to
alexandria and reading host paths read-only:

| Job | When (São Paulo) | What |
|---|---|---|
| `restic-backup` | Daily 22:00 | Back up the targets below |
| `restic-prune` | Sundays 05:00 | `forget --keep-last 5 --keep-monthly 2 --prune` |

Host and mount paths match the old NAS job (`--host alexandria`,
`/mnt/docker-volumes`, `/mnt/immich`), so the snapshot history continues.

| Target | Host path | Why |
|---|---|---|
| Docker volumes | `/data/docker/lib/volumes` | NAS compose apps not yet moved to k3s. Drop once none are left |
| Immich | `/archive/data/nas/immich` | Photos (most also in Google Photos) and extracted courses (only copy) |

Skipped:

| Path | Why |
|---|---|
| Immich `thumbs/`, `encoded-video/` | Generated by Immich from the originals |
| `/archive/media` (movies, TV) | Can be re-downloaded |
| `/archive/torrents` | Downloads in progress |
| Frigate recordings | Short-lived by design |

Run a backup now:

```sh
kubectl -n restic create job restic-backup-manual-$(date +%s) --from=cronjob/restic-backup
```

### History: NAS restic outage

From 2025-05-21 to 2026-10-21 the NAS restic job never ran. `runitor-restic`
was built locally (`pull_policy: build`), Docker's data root moved to
`/data/docker/lib` around 2025-05-23, the local image was lost, and ofelia
could not pull it from any registry. Its healthchecks pings could not have
alerted either: `healthchecks.local.andreroggeri.com.br` does not resolve.

## Alerts

Each restic job reports to an Uptime Kuma push monitor when it finishes (`up`
on success, `down` with the exit code on failure). Uptime Kuma alerts through
Telegram on a `down` push or when no push arrives in time.

| Monitor | Expects a push every | Token |
|---|---|---|
| Backup: restic | 25 hours | `restic/restic-pings`, key `backup` |
| Backup: restic prune | 8 days | `restic/restic-pings`, key `prune` |
| Backup: longhorn | 25 hours | `longhorn-system/longhorn-backup-ping` |

Without the restic token secret the restic jobs still run, they just don't
report.

Longhorn backups are checked by the `backup-check` CronJob in `longhorn-system`
(04:00 São Paulo, an hour after the backup). It pushes `down` with the names of
any volumes in the `backup` group whose last backup is older than 25 hours, or
if the group is empty.

## Known gaps

- Uptime Kuma runs in k3s too. A cluster outage stops the backups and the
  alert about them at the same time. Fix: ping hosted healthchecks.io instead.
## Restore tests

Last tested 2026-10-21. Repeat after big changes (Longhorn or restic upgrades,
bucket changes).

| What | How | Result |
|---|---|---|
| n8n Postgres (Longhorn) | New PVC from the backup via a temporary StorageClass with `fromBackup`, then Postgres started by hand on it (`ssl=off`, `archive_mode=off`, `chmod 0700 pgdata` first) | Crash recovery ran, workflow/credential/migration counts matched live |
| Immich files (restic) | `restic restore latest --tag images --include <file>` for 3 random photos | Checksums matched the originals |

## Adding a new app

When adding an app to k3s, decide which list its volumes go in and update this
file. If backed up, add the volume to the `backup` recurring-job group.

## Removed apps

| App | Removed | Last backup in B2 |
|---|---|---|
| Open WebUI | 2026-10-23 (unused) | `open-webui` volume, 2026-10-23 06:09 UTC. Restore it in the Longhorn UI (Backups) if ever needed. Old backups of removed volumes are not pruned automatically. |
