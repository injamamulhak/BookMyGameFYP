-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "is_flagged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "training_videos" ADD COLUMN     "uploader_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "can_upload_videos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "video_uploader_request_status" VARCHAR(20) NOT NULL DEFAULT 'none';

-- CreateTable
CREATE TABLE "review_replies" (
    "id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_replies_review_id_idx" ON "review_replies"("review_id");

-- CreateIndex
CREATE INDEX "training_videos_uploader_id_idx" ON "training_videos"("uploader_id");

-- AddForeignKey
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_videos" ADD CONSTRAINT "training_videos_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
