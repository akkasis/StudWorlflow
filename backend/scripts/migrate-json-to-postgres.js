const { PrismaClient, Prisma } = require('@prisma/client')
const { existsSync, readFileSync } = require('fs')
const { join } = require('path')
const { randomUUID } = require('crypto')

const prisma = new PrismaClient()
const dataDir = join(process.cwd(), 'data')

function readJson(filename, fallback) {
  const filePath = join(dataDir, filename)
  if (!existsSync(filePath)) {
    return fallback
  }

  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch {
    return fallback
  }
}

function sortPair(first, second) {
  return first < second ? [first, second] : [second, first]
}

async function migrateMessages() {
  const store = readJson('messages.json', { conversations: [] })
  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      userId: true,
    },
  })
  const profileIdByUserId = new Map(profiles.map((profile) => [profile.userId, profile.id]))

  for (const conversation of store.conversations || []) {
    const [firstUserId, secondUserId] = conversation.participantUserIds || []
    if (!firstUserId || !secondUserId) {
      continue
    }

    const firstProfileId = profileIdByUserId.get(firstUserId)
    const secondProfileId = profileIdByUserId.get(secondUserId)
    if (!firstProfileId || !secondProfileId) {
      continue
    }

    const [participantOneProfileId, participantTwoProfileId] = sortPair(
      firstProfileId,
      secondProfileId,
    )
    const conversationId =
      conversation.id ||
      `conversation_${participantOneProfileId}_${participantTwoProfileId}`

    await prisma.$executeRaw`
      INSERT INTO "Conversation" (
        "id",
        "participantOneProfileId",
        "participantTwoProfileId",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${conversationId},
        ${participantOneProfileId},
        ${participantTwoProfileId},
        ${conversation.createdAt ? new Date(conversation.createdAt) : new Date()},
        ${conversation.updatedAt ? new Date(conversation.updatedAt) : new Date()}
      )
      ON CONFLICT ("participantOneProfileId", "participantTwoProfileId")
      DO NOTHING
    `

    const participantOneUserId =
      participantOneProfileId === firstProfileId ? firstUserId : secondUserId
    const participantTwoUserId =
      participantTwoProfileId === secondProfileId ? secondUserId : firstUserId

    for (const message of conversation.messages || []) {
      await prisma.$executeRaw`
        INSERT INTO "Message" (
          "id",
          "conversationId",
          "senderUserId",
          "text",
          "createdAt",
          "readByParticipantOne",
          "readByParticipantTwo"
        )
        VALUES (
          ${String(message.id || randomUUID())},
          ${conversationId},
          ${Number(message.senderUserId)},
          ${String(message.text || '')},
          ${message.createdAt ? new Date(message.createdAt) : new Date()},
          ${Boolean(message.readByUserIds?.includes(participantOneUserId))},
          ${Boolean(message.readByUserIds?.includes(participantTwoUserId))}
        )
        ON CONFLICT ("id") DO NOTHING
      `
    }
  }
}

async function migrateSupport() {
  const store = readJson('support.json', { threads: [] })

  for (const thread of store.threads || []) {
    await prisma.$executeRaw`
      INSERT INTO "SupportThread" (
        "userId",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${Number(thread.userId)},
        ${thread.createdAt ? new Date(thread.createdAt) : new Date()},
        ${thread.updatedAt ? new Date(thread.updatedAt) : new Date()}
      )
      ON CONFLICT ("userId") DO NOTHING
    `

    for (const message of thread.messages || []) {
      await prisma.$executeRaw`
        INSERT INTO "SupportMessage" (
          "id",
          "threadUserId",
          "senderUserId",
          "text",
          "createdAt"
        )
        VALUES (
          ${String(message.id || randomUUID())},
          ${Number(thread.userId)},
          ${Number(message.senderUserId)},
          ${String(message.text || '')},
          ${message.createdAt ? new Date(message.createdAt) : new Date()}
        )
        ON CONFLICT ("id") DO NOTHING
      `
    }
  }
}

async function migrateModeration() {
  const store = readJson('moderation.json', { users: {}, reviews: {} })

  for (const [userId, state] of Object.entries(store.users || {})) {
    await prisma.$executeRaw`
      INSERT INTO "UserModerationState" (
        "userId",
        "tutorVerified",
        "banPermanent",
        "banUntil",
        "banReason"
      )
      VALUES (
        ${Number(userId)},
        ${Boolean(state.tutorVerified)},
        ${Boolean(state.ban?.permanent)},
        ${state.ban?.until ? new Date(state.ban.until) : null},
        ${state.ban?.reason || null}
      )
      ON CONFLICT ("userId")
      DO UPDATE SET
        "tutorVerified" = EXCLUDED."tutorVerified",
        "banPermanent" = EXCLUDED."banPermanent",
        "banUntil" = EXCLUDED."banUntil",
        "banReason" = EXCLUDED."banReason"
    `
  }

  for (const [reviewId, state] of Object.entries(store.reviews || {})) {
    await prisma.$executeRaw`
      INSERT INTO "ReviewModerationState" (
        "reviewId",
        "verified"
      )
      VALUES (
        ${Number(reviewId)},
        ${Boolean(state.verified)}
      )
      ON CONFLICT ("reviewId")
      DO UPDATE SET
        "verified" = EXCLUDED."verified"
    `
  }
}

async function migrateProfileMeta() {
  const store = readJson('profile-meta.json', { availability: {}, banners: {} })

  for (const [profileId, availability] of Object.entries(store.availability || {})) {
    await prisma.$executeRaw`
      UPDATE "Profile"
      SET
        "availabilityFormats" = ARRAY[${Prisma.join(availability.formats || [])}]::TEXT[],
        "availabilityDays" = ARRAY[${Prisma.join(availability.primeDays || [])}]::TEXT[],
        "availabilityTime" = ${availability.primeTime || null},
        "availabilityNote" = ${availability.note || null}
      WHERE "id" = ${Number(profileId)}
    `
  }

  for (const [profileId, banner] of Object.entries(store.banners || {})) {
    await prisma.$executeRaw`
      UPDATE "Profile"
      SET "bannerUrl" = ${banner || null}
      WHERE "id" = ${Number(profileId)}
    `
  }
}

async function main() {
  await migrateMessages()
  await migrateSupport()
  await migrateModeration()
  await migrateProfileMeta()
  console.log('JSON data migrated to PostgreSQL')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
