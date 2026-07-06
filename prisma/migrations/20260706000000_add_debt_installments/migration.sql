-- CreateEnum
CREATE TYPE "DebtKind" AS ENUM ('SIMPLE', 'INSTALLMENT');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('PENDING', 'PAID');

-- AlterTable
ALTER TABLE "Debt" ADD COLUMN "kind" "DebtKind" NOT NULL DEFAULT 'SIMPLE';

-- CreateTable
CREATE TABLE "DebtInstallment" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "paidOn" TIMESTAMP(3),
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebtInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DebtInstallment_paymentId_key" ON "DebtInstallment"("paymentId");

-- CreateIndex
CREATE INDEX "DebtInstallment_debtId_idx" ON "DebtInstallment"("debtId");

-- CreateIndex
CREATE INDEX "DebtInstallment_dueDate_idx" ON "DebtInstallment"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "DebtInstallment_debtId_seq_key" ON "DebtInstallment"("debtId", "seq");

-- AddForeignKey
ALTER TABLE "DebtInstallment" ADD CONSTRAINT "DebtInstallment_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtInstallment" ADD CONSTRAINT "DebtInstallment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "DebtPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
