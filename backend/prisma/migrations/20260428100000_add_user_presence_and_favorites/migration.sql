ALTER TABLE "User"
ADD COLUMN "lastSeenAt" TIMESTAMP(3);

CREATE TABLE "FavoriteTutor" (
  "studentUserId" INTEGER NOT NULL,
  "tutorProfileId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FavoriteTutor_pkey" PRIMARY KEY ("studentUserId", "tutorProfileId"),
  CONSTRAINT "FavoriteTutor_studentUserId_fkey" FOREIGN KEY ("studentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FavoriteTutor_tutorProfileId_fkey" FOREIGN KEY ("tutorProfileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "FavoriteTutor_tutorProfileId_idx"
ON "FavoriteTutor" ("tutorProfileId");
