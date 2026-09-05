# Mixuruca operations

Mixuruca runs as one Recreate-strategy pod in the `mixuruca` namespace. Its
SQLite database, browser profiles, and reconciliation cache share the
`mixuruca-data` Longhorn PVC. Do not scale the deployment above one replica.

## Release an application update

1. From the Mixuruca source repository, choose an immutable source revision and
   publish all three multi-architecture images to the private registry:

   ```sh
   revision="$(git rev-parse --short=7 HEAD)"
   docker login registry.local.roggeri.com.br

   docker buildx build --platform linux/amd64,linux/arm64 --push \
     -t "registry.local.roggeri.com.br/mixuruca-server:${revision}" \
     -f deploy/docker/server.Dockerfile .
   docker buildx build --platform linux/amd64,linux/arm64 --push \
     -t "registry.local.roggeri.com.br/mixuruca-worker:${revision}" \
     -f deploy/docker/worker.Dockerfile .
   docker buildx build --platform linux/amd64,linux/arm64 --push \
     -t "registry.local.roggeri.com.br/mixuruca-novnc:${revision}" \
     -f deploy/docker/novnc.Dockerfile .
   ```

2. In `k3s/applications/mixuruca/values.yaml`, set the `server`, `worker`, and
   `novnc` tags to the same `revision`.

3. Review and apply only this release:

   ```sh
   helmfile -f k3s/helmfile.yaml -l name=mixuruca --skip-deps sync
   kubectl -n mixuruca rollout status deployment/mixuruca --timeout=10m
   curl --fail https://compras.local.roggeri.com.br/health
   ```

The init container applies pending SQLite migrations before the server and
worker start. The Recreate strategy creates brief downtime during a rollout so
two processes never write the RWO SQLite volume at once.

## Roll back application code

Set all three image tags back to the prior known-good revision and run the same
`helmfile` command. This rolls back code only; SQLite migrations are not
automatically reversed. Take a PVC-consistent backup before any release that
contains a schema migration.

## Persistent data and capacity

The `mixuruca-data` claim is 20Gi and stores the database at
`/data/mixuruca.sqlite`, Chromium profiles under `/data/profiles`, and
reconciliation artifacts under `/data/recon`. It uses two Longhorn replicas.
Keep a meaningful amount of free capacity because browser profiles can grow
quickly.
