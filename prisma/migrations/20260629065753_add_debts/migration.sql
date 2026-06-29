-- CreateEnum
CREATE TYPE "DebtDirection" AS ENUM ('I_OWE', 'OWED_TO_ME');

-- CreateEnum
CREATE TYPE "DebtStatus" AS ENUM ('OPEN', 'PAID');

-- CreateTable
CREATE TABLE "Counterparty" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Counterparty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Debt" (
    "id" TEXT NOT NULL,
    "counterpartyId" TEXT NOT NULL,
    "direction" "DebtDirection" NOT NULL,
    "principal" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KZT',
    "description" TEXT,
    "borrowedOn" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "DebtStatus" NOT NULL DEFAULT 'OPEN',
    "disbursementTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DebtPayment" (
    "id" TEXT NOT NULL,
    "debtId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paidOn" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DebtPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Counterparty_name_key" ON "Counterparty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Debt_disbursementTransactionId_key" ON "Debt"("disbursementTransactionId");

-- CreateIndex
CREATE INDEX "Debt_counterpartyId_idx" ON "Debt"("counterpartyId");

-- CreateIndex
CREATE INDEX "Debt_status_idx" ON "Debt"("status");

-- CreateIndex
CREATE INDEX "Debt_dueDate_idx" ON "Debt"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "DebtPayment_transactionId_key" ON "DebtPayment"("transactionId");

-- CreateIndex
CREATE INDEX "DebtPayment_debtId_idx" ON "DebtPayment"("debtId");

-- AddForeignKey
ALTER TABLE "Debt" ADD CONSTRAINT "Debt_counterpartyId_fkey" FOREIGN KEY ("counterpartyId") REFERENCES "Counterparty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DebtPayment" ADD CONSTRAINT "DebtPayment_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
