# Production deploy runbook

## Normal deploy

Use the repository deploy script. It automatically uses Docker Compose v2 when available and falls back to a `ContainerConfig`-safe flow for legacy `docker-compose` v1:

```bash
cd ~/StudWorlflow
./deploy/production-deploy.sh
```

You can deploy another branch if needed:

```bash
cd ~/StudWorlflow
DEPLOY_BRANCH=work ./deploy/production-deploy.sh
```

## Manual deploy with Docker Compose v2

Use Docker Compose v2 when it is available:

```bash
cd ~/StudWorlflow
git pull origin work
docker compose -f docker-compose.production.yml up -d --build
```

Do not use `docker-compose -f docker-compose.production.yml up -d --build` on servers that still run legacy `docker-compose` v1. It can fail during recreate with `KeyError: 'ContainerConfig'`.

## Manual legacy deploy

```bash
cd ~/StudWorlflow
git pull origin work
docker-compose -f docker-compose.production.yml build backend frontend
docker-compose -f docker-compose.production.yml up -d postgres adminer
docker ps -a --format '{{.Names}}' | grep -E '(^|_)studworlflow_(backend|frontend)_1$' | xargs -r docker rm -f
docker-compose -f docker-compose.production.yml up -d --no-build backend frontend
```

## Legacy `ContainerConfig` recovery

`docker-compose` v1.29.2 can fail during container recreation with:

```text
KeyError: 'ContainerConfig'
```

The application image usually builds successfully before this error. Remove stale app containers and start services without rebuilding:

```bash
cd ~/StudWorlflow
docker ps -a --format '{{.Names}}' | grep -E '(^|_)studworlflow_(backend|frontend)_1$' | xargs -r docker rm -f
docker-compose -f docker-compose.production.yml up -d --no-build backend frontend
```

The command also removes prefixed stale names like `668feb13b5fa_studworlflow_backend_1`.

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
