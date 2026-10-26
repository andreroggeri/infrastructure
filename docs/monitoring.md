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

## Login

Pocket ID, client `beszel`. Only users that already exist in Beszel can log in
(`USER_CREATION` is off). Password login is off (`DISABLE_PASSWORD_AUTH`). Beszel matches the login by email, and only trusts
it when Pocket ID marks the email as verified; an unverified email fails with
"Only superusers can perform this action" and a blank screen. The first admin user comes from sealed secret
`beszel-hub` (`USER_EMAIL`, `USER_PASSWORD`); the same credentials are the
PocketBase superuser at `/_/`.

## Alerts

Sent to the same Telegram chat as Uptime Kuma. Configured for all nodes:

| Alert | Fires when |
|---|---|
| Status | Node down for 5 min |
| Disk | Any disk above 90% for 10 min |
| Memory | Above 90% for 10 min |

Alert rules, the Telegram link and the OIDC client secret live in the hub's
database (backed up with its Longhorn volume), not in this repo.
