-- AlterTable
ALTER TABLE "events" ADD COLUMN     "registration_deadline" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "refund_amount" DECIMAL(10,2),
ADD COLUMN     "refund_pidx" VARCHAR(255),
ADD COLUMN     "refund_status" VARCHAR(20),
ADD COLUMN     "refunded_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "time_slots" ADD COLUMN     "locked_at" TIMESTAMP(3),
ADD COLUMN     "locked_by" VARCHAR(36);
