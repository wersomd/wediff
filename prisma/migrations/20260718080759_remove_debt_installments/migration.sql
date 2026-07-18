/*
  Warnings:

  - You are about to drop the column `kind` on the `Debt` table. All the data in the column will be lost.
  - You are about to drop the `DebtInstallment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DebtInstallment" DROP CONSTRAINT "DebtInstallment_debtId_fkey";

-- DropForeignKey
ALTER TABLE "DebtInstallment" DROP CONSTRAINT "DebtInstallment_paymentId_fkey";

-- AlterTable
ALTER TABLE "Debt" DROP COLUMN "kind";

-- DropTable
DROP TABLE "DebtInstallment";

-- DropEnum
DROP TYPE "DebtKind";

-- DropEnum
DROP TYPE "InstallmentStatus";
