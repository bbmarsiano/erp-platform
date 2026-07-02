-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "posInvoiceStartNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "posInvoiceLastNumber" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PosInvoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "taxEventDate" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL,
    "vatAmount" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "paymentMethod" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "note" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PosInvoice_saleId_key" ON "PosInvoice"("saleId");
CREATE UNIQUE INDEX IF NOT EXISTS "PosInvoice_tenantId_number_key" ON "PosInvoice"("tenantId", "number");
CREATE INDEX IF NOT EXISTS "PosInvoice_tenantId_idx" ON "PosInvoice"("tenantId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PosInvoice" ADD CONSTRAINT "PosInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PosInvoice" ADD CONSTRAINT "PosInvoice_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PosInvoice" ADD CONSTRAINT "PosInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
