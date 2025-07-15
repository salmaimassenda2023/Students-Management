/*
  Warnings:

  - You are about to drop the column `phone` on the `student` table. All the data in the column will be lost.
  - Added the required column `phone_number` to the `student` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "student" DROP COLUMN "phone",
ADD COLUMN     "phone_number" TEXT NOT NULL;
