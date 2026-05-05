# Studworkflow Production Guide

## Что уже подготовлено в коде

- backend больше не зависит от жесткого `localhost` и читает конфиг из env
- frontend больше не ходит в API по захардкоженному адресу и использует `NEXT_PUBLIC_API_URL`
- JWT secret вынесен в env
- CORS вынесен в env
- добавлен health endpoint `GET /health`
- добавлены production Dockerfile для backend и frontend
- добавлен production compose-шаблон
- убран `ignoreBuildErrors` из Next.js config

## Что я уже сделал за тебя

### Backend

- добавил `backend/src/config/app.config.ts`
- вынес `PORT`, `HOST`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`
- убрал повторяющиеся hardcoded JWT secrets из Nest modules
- добавил `backend/.env.example`
- добавил `backend/Dockerfile`
- добавил `GET /health`

### Frontend

- добавил helper `frontend/lib/api.ts`
- заменил все основные fetch-запросы на env-based API URL
- убрал `ignoreBuildErrors`
- подготовил production Dockerfile в `deploy/frontend.Dockerfile`
- подготовил пример env для frontend в `deploy/frontend.env.example`

## Что тебе нужно сделать самому

Ниже именно те шаги, которые невозможно сделать за тебя локально, потому что для них нужны твой домен, сервер, почта и реальные пароли.

---

## Часть 1. Купить и подготовить сервер

### Шаг 1. Купить VPS

Подойдет любой VPS, где можно поднять Docker.

Минимальная конфигурация:
- 2 vCPU
- 4 GB RAM
- 40 GB SSD
- Ubuntu 24.04 LTS

Хорошо подойдут:
- Timeweb Cloud
- Selectel
- Hetzner
- DigitalOcean
- Vultr

### Шаг 2. Подключиться к серверу

После покупки получишь:
- IP-адрес
- пользователя, обычно `root`
- пароль или SSH key

Подключение:

```bash
ssh root@IP_СЕРВЕРА
```

---

## Часть 2. Установить Docker на сервер

### Шаг 3. Обновить сервер

```bash
apt update && apt upgrade -y
```

### Шаг 4. Установить Docker

```bash
apt install -y docker.io docker-compose-plugin
systemctl enable docker
systemctl start docker
```

Проверка:

```bash
docker --version
docker compose version
```

---

## Часть 3. Купить и настроить домен

### Шаг 5. Купить домен

Нужен один основной домен, например:
- `skillent.ru`
- или любой другой, который ты выберешь

### Шаг 6. Настроить DNS

В панели домена создай A-записи:

- `@` -> IP сервера
- `www` -> IP сервера

Подожди, пока DNS применится. Иногда это 5 минут, иногда до нескольких часов.

---

## Часть 4. Залить проект на сервер

### Шаг 7. Установить Git

```bash
apt install -y git
```

### Шаг 8. Клонировать проект

```bash
git clone URL_ТВОЕГО_РЕПО studworkflow
cd studworkflow
```

Если репозиторий приватный, настрой SSH key или personal access token.

---

## Часть 5. Подготовить production env

### Шаг 9. Создать env для backend

Скопируй шаблон:

```bash
cp backend/.env.example backend/.env.production
```

Открой:

```bash
nano backend/.env.production
```

И заполни.

Пример:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3001
DATABASE_URL=postgresql://studworkflow:SUPER_DB_PASSWORD@postgres:5432/studworkflow?schema=public
JWT_SECRET=LONG_RANDOM_SECRET_WITH_32_PLUS_CHARACTERS
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://skillent.ru,https://www.skillent.ru
ROOT_ADMIN_EMAIL=your-real-admin-email@example.com
ROOT_ADMIN_PASSWORD=SUPER_STRONG_ADMIN_PASSWORD
```

Что важно:
- `JWT_SECRET` должен быть длинным, случайным и уникальным
- `ROOT_ADMIN_PASSWORD` нельзя оставлять дефолтным
- `DATABASE_URL` должен совпадать с данными postgres
- не коммить реальные production-секреты из `backend/.env.production`

### Шаг 10. Создать env для frontend

Скопируй пример:

```bash
cp deploy/frontend.env.example deploy/frontend.env.production
```

Открой:

```bash
nano deploy/frontend.env.production
```

Пропиши:

```env
NEXT_PUBLIC_API_URL=https://skillent.ru/api
```

### Шаг 11. Создать root `.env` для docker compose

В корне проекта создай файл `.env`:

```bash
nano .env
```

Содержимое:

```env
POSTGRES_USER=studworkflow
POSTGRES_PASSWORD=SUPER_DB_PASSWORD
POSTGRES_DB=studworkflow
```

Очень важно, чтобы:
- `POSTGRES_PASSWORD` был сложным
- `POSTGRES_PASSWORD` был уникальным и не совпадал с паролями от других сервисов
- логин/пароль совпадали с тем, что ты вставил в `DATABASE_URL`
- root `.env` с реальными production-секретами не должен попадать в git

---

## Часть 6. Запустить production через Docker

### Шаг 12. Собрать контейнеры

В корне проекта:

```bash
docker compose -f docker-compose.production.yml build
```

### Шаг 13. Запустить контейнеры

```bash
docker compose -f docker-compose.production.yml up -d
```

### Шаг 14. Проверить, что все поднялось

```bash
docker compose -f docker-compose.production.yml ps
```

Ты должен увидеть:
- `postgres`
- `backend`
- `frontend`

### Шаг 15. Проверить backend health

```bash
curl http://127.0.0.1:3001/health
```

Нормальный ответ:

```json
{"status":"ok","timestamp":"..."}
```

---

## Часть 7. Настроить Nginx и HTTPS

### Шаг 16. Установить Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### Шаг 17. Настроить frontend-домен

Создай конфиг:

```bash
nano /etc/nginx/sites-available/skillent
```

Вставь:

```nginx
server {
    server_name skillent.ru www.skillent.ru;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Шаг 19. Активировать конфиги

```bash
ln -s /etc/nginx/sites-available/skillent /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Шаг 20. Выпустить SSL

Установи certbot:

```bash
apt install -y certbot python3-certbot-nginx
```

Выпусти сертификаты:

```bash
certbot --nginx -d skillent.ru -d www.skillent.ru
```

---

## Часть 8. Проверить сайт

После SSL проверь:

- `https://skillent.ru`
- `https://skillent.ru/api/health`

Если фронт открылся, а логин/регистрация не работают:
- скорее всего неверный `NEXT_PUBLIC_API_URL`
- или CORS в backend не совпадает с доменом

---

## Часть 9. Как обновлять сайт после изменений

После новых коммитов:

```bash
cd studworkflow
git pull
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
```

Если менялась Prisma schema:

backend контейнер сам вызывает:

```bash
npx prisma migrate deploy
```

при запуске.

---

## Часть 10. Что еще обязательно нужно сделать перед настоящим публичным запуском

Это уже следующий этап. Я не стал имитировать это “на бумаге”, а честно отмечаю, что пока это еще нужно доделать.

### 1. Убрать JSON-хранилища

Сейчас у тебя часть данных еще хранится в:
- `backend/data/messages.json`
- `backend/data/support.json`
- `backend/data/moderation.json`
- `backend/data/profile-meta.json`

Для настоящего production нужно перенести это в PostgreSQL.

### 2. Вынести аватары и баннеры в object storage

Сейчас аватары и баннеры хранятся не как нормальное файловое хранилище.

Для production лучше использовать:
- S3
- Cloudflare R2
- Supabase Storage

### 3. Сделать подтверждение email

Сейчас регистрация рабочая, но “призрачная” в том смысле, что email не подтверждается.

Нужно добавить:
- email verification
- reset password

### 4. Добавить защиту от abuse

Нужно добавить:
- rate limiting
- ограничение на login/register/review/support

### 5. Настроить backup

Обязательно:
- backup PostgreSQL
- backup storage

### 6. Подготовить юридические страницы

Нужны:
- политика конфиденциальности
- пользовательское соглашение
- правила модерации

---

## Быстрый чек-лист перед открытием сайта

- сервер куплен
- домен куплен
- DNS настроен
- Docker установлен
- `backend/.env.production` заполнен
- `deploy/frontend.env.production` заполнен
- root `.env` заполнен
- `JWT_SECRET` заменен
- root admin пароль заменен
- `POSTGRES_PASSWORD`, `JWT_SECRET`, `ROOT_ADMIN_PASSWORD` сильные и уникальные
- реальные production-секреты не закоммичены
- Adminer не открыт публично в интернет и доступен только через SSH-туннель:
  `ssh -L 8080:localhost:8080 user@SERVER_IP`
- `docker compose ... up -d` выполнен
- `https://skillent.ru/api/health` отвечает
- `https://skillent.ru` открывается

---

## Что я рекомендую делать следующим сообщением

Следующий логичный этап — не просто “деплой”, а перенос временных JSON-хранилищ в Prisma/PostgreSQL. Это уже реальный шаг от демо-сайта к настоящему сервису.
