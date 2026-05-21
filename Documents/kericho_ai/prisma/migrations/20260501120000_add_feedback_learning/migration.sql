-- Add message linkage and snake_case timestamps to the existing Feedback table.
-- This migration assumes the table already exists from the previous Prisma schema.

ALTER TABLE "Feedback" RENAME COLUMN "userId" TO "user_id";
ALTER TABLE "Feedback" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "Feedback" ADD COLUMN IF NOT EXISTS "message_id" TEXT;

-- Keep legacy rows working while enabling the new response linkage.
CREATE INDEX IF NOT EXISTS "Feedback_user_id_idx" ON "Feedback"("user_id");
CREATE INDEX IF NOT EXISTS "Feedback_message_id_idx" ON "Feedback"("message_id");
CREATE INDEX IF NOT EXISTS "Feedback_created_at_idx" ON "Feedback"("created_at");

ALTER TABLE "Feedback"
  ADD CONSTRAINT "Feedback_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "ConversationMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
