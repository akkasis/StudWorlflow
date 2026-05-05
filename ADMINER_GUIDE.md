# Adminer Guide

`Adminer` is a lightweight web panel for viewing and editing your PostgreSQL database in the browser.

## 1. Start Adminer

In the project root:

```bash
docker-compose -f docker-compose.production.yml up -d adminer
```

If you are rebuilding the whole project:

```bash
docker-compose -f docker-compose.production.yml up -d
```

By default, Adminer will be available at:

```text
http://localhost:8080
```

In production, Adminer is bound to `127.0.0.1` and must not be exposed directly to the internet.
Open it through an SSH tunnel from your local machine:

```bash
ssh -L 8080:localhost:8080 user@SERVER_IP
```

Then open locally:

```text
http://localhost:8080
```

## 2. Login data

On the login screen, enter:

- `System`: `PostgreSQL`
- `Server`: `postgres`
- `Username`: the value from root `.env` -> `POSTGRES_USER`
- `Password`: the value from root `.env` -> `POSTGRES_PASSWORD`
- `Database`: the value from root `.env` -> `POSTGRES_DB`

Example with placeholder values:

- `System`: `PostgreSQL`
- `Server`: `postgres`
- `Username`: `studworkflow`
- `Password`: `SUPER_DB_PASSWORD`
- `Database`: `studworkflow`

## 3. What tables matter

Main application tables:

- `User` — all accounts
- `Profile` — student/tutor profiles
- `Review` — tutor reviews
- `Tag` — skills/tags
- `ProfileTag` — profile/tag relation

New database-backed tables:

- `Conversation` — user-to-user chats
- `Message` — chat messages
- `SupportThread` — support chat threads
- `SupportMessage` — support messages
- `UserModerationState` — bans and tutor verification
- `ReviewModerationState` — review verification

## 4. How to view users

Open table `User`, then click `Select data`.

Useful fields:

- `id`
- `email`
- `role`
- `createdAt`

If you want the matching public profile, open `Profile` and find the row where `userId` equals the user `id`.

## 5. How to view tutor/student profiles

Open `Profile` -> `Select data`.

Important fields:

- `id`
- `userId`
- `name`
- `role`
- `university`
- `course`
- `description`
- `priceFrom`
- `rating`
- `avatarUrl`
- `bannerUrl`
- `availabilityFormats`
- `availabilityDays`
- `availabilityTime`
- `availabilityNote`

## 6. How to view messages

### Regular chat

1. Open `Conversation`
2. Find the conversation row
3. Copy its `id`
4. Open `Message`
5. Filter by `conversationId`

### Support chat

1. Open `SupportThread`
2. Find the user's `userId`
3. Open `SupportMessage`
4. Filter by `threadUserId`

## 7. How to edit data safely

Recommended order:

1. First click `Select data`
2. Find the exact row
3. Open that row
4. Only then click `Edit`

Try not to delete rows from relation tables blindly unless you know what depends on them.

## 8. Useful admin actions

### Ban a user

Open `UserModerationState`.

Fields:

- `userId` — target user
- `banPermanent` — `true` for permanent ban
- `banUntil` — date/time for temporary ban
- `banReason` — explanation

### Verify a tutor

Open `UserModerationState` and set:

- `tutorVerified` -> `true`

### Verify a review

Open `ReviewModerationState` and set:

- `reviewId` -> target review id
- `verified` -> `true`

## 9. Important safety note

`Adminer` gives direct database access. In production, do not leave port `8080` open to the whole internet forever.

Required production setup:

- keep Adminer bound to `127.0.0.1:8080:8080` in `docker-compose.production.yml`
- connect through an SSH tunnel:
  `ssh -L 8080:localhost:8080 user@SERVER_IP`
- do not commit real production passwords or `.env.production` secrets
- use strong, unique values for `POSTGRES_PASSWORD`, `JWT_SECRET`, and `ROOT_ADMIN_PASSWORD`
