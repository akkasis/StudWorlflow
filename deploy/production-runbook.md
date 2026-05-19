# Production deploy runbook

## Normal deploy

Use Docker Compose v2 when it is available:

```bash
cd ~/StudWorlflow
git pull origin work
docker compose -f docker-compose.production.yml up -d --build
```

If the server still uses legacy `docker-compose` v1, the equivalent command is:

```bash
cd ~/StudWorlflow
git pull origin work
docker-compose -f docker-compose.production.yml up -d --build
```

## Legacy `ContainerConfig` recovery

`docker-compose` v1.29.2 can fail during container recreation with:

```text
KeyError: 'ContainerConfig'
```

The application image usually builds successfully before this error. Remove the stale container and start the service without rebuilding:

```bash
cd ~/StudWorlflow
docker ps -a --format '{{.Names}}' | grep studworlflow_frontend
docker rm -f <frontend-container-name>
docker-compose -f docker-compose.production.yml up -d frontend
```

If several stale frontend containers exist, remove all names shown by the `grep` command.

## Full cleanup fallback

Use this only when the targeted frontend cleanup did not help:

```bash
cd ~/StudWorlflow
docker-compose -f docker-compose.production.yml down --remove-orphans
docker rm -f studworlflow_backend_1 studworlflow_frontend_1 studworlflow_adminer_1 studworlflow_postgres_1 2>/dev/null || true
docker-compose -f docker-compose.production.yml up -d
```

## Recommended server fix

Install Docker Compose v2 and prefer `docker compose` over legacy `docker-compose`. This avoids the old Python Compose `ContainerConfig` bug and makes deploys more predictable.
