-- AlterTable
ALTER TABLE "products" ADD COLUMN     "original_price" DECIMAL(10,2),
ADD COLUMN     "seller_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "can_sell_products" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "products_seller_id_idx" ON "products"("seller_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
