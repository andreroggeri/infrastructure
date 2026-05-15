# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Manages

Personal homelab infrastructure across three layers:
- **K3s cluster** — Kubernetes workloads via Helmfile (`k3s/`)
- **NAS** — Docker Compose stacks for media, photos, monitoring (`nas/compose/`)
- **Ansible** — Provisioning for nodes, VPN, K3s setup (`ansible/`)

## K3s / Helmfile

All cluster state lives in `k3s/helmfile.yaml`. Applications have values in `k3s/applications/<app>/values.yaml`. Custom charts are in `k3s/charts/`.

**Deploy a single app (preferred):**
```bash
cd k3s
helmfile -l name=<app-name> --skip-deps sync
```

**Full diff / sync:**
```bash
helmfile diff
helmfile sync   # avoid unless necessary — reconciles entire cluster
```

Always pass `--skip-deps` unless a new chart repository was added.

### Adding a new application

1. Add chart repo to `repositories` in `helmfile.yaml` (if external)
2. Add release to `releases` in `helmfile.yaml` with `needs:` dependencies
3. Create `k3s/applications/<app>/values.yaml`
4. If secrets are needed, create a sealed secret with `utils/seal-secret.sh` and add the manifest under `k3s/charts/sealed-secrets-manifests/templates/`
5. Deploy: `helmfile -l name=<app> --skip-deps sync`

### Conventions

- **Ingress domain:** `<service>.local.roggeri.com.br` (internal), `<service>.roggeri.com.br` (public)
- **Ingress class:** `traefik`
- **Primary storage class:** `longhorn` — always set the minimum viable size (disk space is scarce)
- **Namespace:** one per application, `createNamespace: true` in helmfile
- **PostgreSQL:** CNPG operator (`postgresql.cnpg.io/v1` `Cluster`) via `extraManifests` in values.yaml
- **Secrets:** Bitnami Sealed Secrets — controller runs in `kube-system` as `sealed-secrets`

### Sealed Secrets

Use `utils/seal-secret.sh` to generate sealed secrets interactively (values are never written to shell history):

```bash
bash utils/seal-secret.sh \
  -n <namespace> \
  -s <secret-name> \
  -o k3s/charts/sealed-secrets-manifests/templates/<name>.yaml \
  key1 key2
```

Leave a value empty at the prompt to auto-generate a random hex string.

### Custom Chart Structure

Custom charts follow the pattern in `k3s/charts/memos/` — minimal templates: `deployment.yaml`, `service.yaml`, `ingress.yaml`, `pvc.yaml`, `serviceaccount.yaml`, `_helpers.tpl`. Add `extramanifests.yaml` when the app needs inline CRDs (CNPG clusters, Redis instances).

## Ansible

```bash
cd ansible
make init   # run init.yml (shared + NAS setup)
make vpn    # run vpn.yml (Wireguard)
make k3s    # run k3s.orchestration.site (cluster provisioning)
```

Requires `poetry install` first. All secrets are pulled from 1Password at runtime via `community.general.onepassword` lookups — nothing sensitive is committed.

## NAS

Docker Compose stacks in `nas/compose/` are managed manually (no automation). Renovate auto-updates image tags in docker-compose files.
