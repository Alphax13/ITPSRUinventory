-- CreateEnum
CREATE TYPE "BorrowerType" AS ENUM ('STUDENT', 'LECTURER', 'FACULTY', 'STAFF');

-- AlterTable
ALTER TABLE "AssetBorrow" ADD COLUMN     "borrowOnBehalfOf" TEXT,
ADD COLUMN     "borrowerType" "BorrowerType" NOT NULL DEFAULT 'LECTURER';
