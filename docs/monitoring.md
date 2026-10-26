# Monitoring

[Beszel](https://beszel.dev) at https://monitor.local.roggeri.com.br shows CPU,
memory, disk and network for every node, plus Docker containers on
`alexandria`. It replaced the NAS Prometheus/Grafana/Loki stack (removed
2026-10-26, unused since mid-2025). Uptime Kuma still does up/down checks for
apps and backup jobs.

## How it runs

- k3s release `beszel` (`k3s/charts/beszel`). One hub, one agent per node.
  To add a node, add it under `agent.nodes` in `k3s/applications/beszel/values.yaml`.
- Agents connect to the hub over WebSocket using a permanent universal token
  and register themselves by node name. Sealed secret `beszel-agent` holds the
  token and the hub's public key. The fingerprint lives in
  `/var/lib/beszel-agent` on each node, so restarts don't create duplicates.
- On `alexandria` the agent also reads `/data`, `/archive` and the Docker socket.
- S.M.A.R.T. (`smart: true`) runs on `alexandria` (3 ZFS disks, 2 NVMe) and
  `ubuntu`. Those agents are privileged to reach the disks. They log
  `smartctl failed` for Longhorn's iSCSI volumes; that's expected.

## Login

Pocket ID only (client `beszel`); password login is off. Access is managed in
Pocket ID: the client only admits the group `monitoring`. To give someone
access, add them to that group. Their first login creates a read-only Beszel
account that sees every node.

Beszel matches logins by email and only trusts verified emails. Pocket ID's
`emailsVerified` setting is on, so every email counts as verified. Because of
that, users can't edit their own Pocket ID account (`allowOwnAccountEdit` is
off). Otherwise someone could change their email to yours and log in as you.

The first admin user comes from sealed secret `beszel-hub` (`USER_EMAIL`,
`USER_PASSWORD`). The same credentials are the PocketBase superuser at `/_/`,
which still accepts a password.

## Alerts

Sent to the same Telegram chat as Uptime Kuma. Configured for all nodes:

| Alert | Fires when |
|---|---|
| Status | Node down for 5 min |
| Disk | Any disk above 90% for 10 min |
| Memory | Above 90% for 10 min |
| S.M.A.R.T. | A disk turns WARNING or FAILED (built in, no rule needed) |

Alert rules, the Telegram link and the OIDC client secret live in the hub's
database (backed up with its Longhorn volume), not in this repo.
