-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "barcode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Product_barcode_key" ON "Product"("barcode");
