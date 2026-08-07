/*
  Warnings:

  - A unique constraint covering the columns `[confirmationTokenHash]` on the table `reservations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "confirmationSentAt" TIMESTAMP(3),
ADD COLUMN     "confirmationTokenHash" TEXT,
ADD COLUMN     "confirmedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "reservations_confirmationTokenHash_key" ON "reservations"("confirmationTokenHash");
