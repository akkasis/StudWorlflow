#!/usr/bin/env sh
set -eu

BRANCH="${DEPLOY_BRANCH:-work}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.production.yml}"

cd "$(dirname "$0")/.."

echo "Pulling latest ${BRANCH}..."
git pull origin "$BRANCH"

if docker compose version >/dev/null 2>&1; then
  echo "Using Docker Compose v2."
  docker compose -f "$COMPOSE_FILE" up -d --build --remove-orphans
  exit 0
fi

echo "Using legacy docker-compose. Running ContainerConfig-safe deploy."

docker-compose -f "$COMPOSE_FILE" build backend frontend
docker-compose -f "$COMPOSE_FILE" up -d postgres adminer

STALE_CONTAINERS="$(
  docker ps -a --format '{{.Names}}' \
    | grep -E '(^|_)studworlflow_(backend|frontend)_1$' \
    || true
)"

if [ -n "$STALE_CONTAINERS" ]; then
  echo "Removing stale app containers:"
  echo "$STALE_CONTAINERS"
  echo "$STALE_CONTAINERS" | xargs docker rm -f
fi

docker-compose -f "$COMPOSE_FILE" up -d --no-build backend frontend

echo "Deploy complete."
