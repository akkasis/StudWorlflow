ALTER TABLE "Message"
ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'text',
ADD COLUMN "editedAt" TIMESTAMP(3),
ADD COLUMN "readByParticipantOneAt" TIMESTAMP(3),
ADD COLUMN "readByParticipantTwoAt" TIMESTAMP(3),
ADD COLUMN "replyToMessageId" TEXT;

ALTER TABLE "Message"
ALTER COLUMN "text" SET DEFAULT '';

CREATE TABLE "MessageAttachment" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "durationSec" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Message_replyToMessageId_idx" ON "Message"("replyToMessageId");
CREATE INDEX "MessageAttachment_messageId_createdAt_idx" ON "MessageAttachment"("messageId", "createdAt");

ALTER TABLE "Message"
ADD CONSTRAINT "Message_replyToMessageId_fkey"
FOREIGN KEY ("replyToMessageId") REFERENCES "Message"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "MessageAttachment"
ADD CONSTRAINT "MessageAttachment_messageId_fkey"
FOREIGN KEY ("messageId") REFERENCES "Message"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
