/*
  Warnings:

  - You are about to drop the column `assetId` on the `AssetMaintenance` table. All the data in the column will be lost.
  - You are about to alter the column `cost` on the `AssetMaintenance` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to drop the `Asset` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AssetTransfer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Material` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `fixedAssetId` to the `AssetMaintenance` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."BorrowStatus" AS ENUM ('BORROWED', 'RETURNED', 'OVERDUE', 'LOST');

-- DropForeignKey
ALTER TABLE "public"."Asset" DROP CONSTRAINT "Asset_materialId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AssetMaintenance" DROP CONSTRAINT "AssetMaintenance_assetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."AssetTransfer" DROP CONSTRAINT "AssetTransfer_assetId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_materialId_fkey";

-- AlterTable
ALTER TABLE "public"."AssetMaintenance" DROP COLUMN "assetId",
ADD COLUMN     "fixedAssetId" TEXT NOT NULL,
ADD COLUMN     "nextMaintenanceDate" TIMESTAMP(3),
ADD COLUMN     "performedBy" TEXT,
ALTER COLUMN "maintenanceDate" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "cost" DROP NOT NULL,
ALTER COLUMN "cost" SET DATA TYPE DECIMAL(65,30);

-- DropTable
DROP TABLE "public"."Asset";

-- DropTable
DROP TABLE "public"."AssetTransfer";

-- DropTable
DROP TABLE "public"."Material";

-- CreateTable
CREATE TABLE "public"."ConsumableMaterial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "minStock" INTEGER NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "imageUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsumableMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FixedAsset" (
    "id" TEXT NOT NULL,
    "assetNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(65,30),
    "location" TEXT NOT NULL DEFAULT 'Unassigned',
    "condition" "public"."AssetCondition" NOT NULL DEFAULT 'GOOD',
    "imageUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FixedAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ConsumableTransaction" (
    "id" TEXT NOT NULL,
    "consumableMaterialId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsumableTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AssetBorrow" (
    "id" TEXT NOT NULL,
    "fixedAssetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "borrowDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnDate" TIMESTAMP(3),
    "actualReturnDate" TIMESTAMP(3),
    "purpose" TEXT,
    "note" TEXT,
    "status" "public"."BorrowStatus" NOT NULL DEFAULT 'BORROWED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetBorrow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."materials_legacy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "category" TEXT NOT NULL,
    "unit" TEXT,
    "minStock" INTEGER,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "qrCode" TEXT,
    "isAsset" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "materials_legacy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FixedAsset_assetNumber_key" ON "public"."FixedAsset"("assetNumber");

-- CreateIndex
CREATE UNIQUE INDEX "materials_legacy_code_key" ON "public"."materials_legacy"("code");

-- AddForeignKey
ALTER TABLE "public"."ConsumableTransaction" ADD CONSTRAINT "ConsumableTransaction_consumableMaterialId_fkey" FOREIGN KEY ("consumableMaterialId") REFERENCES "public"."ConsumableMaterial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ConsumableTransaction" ADD CONSTRAINT "ConsumableTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetBorrow" ADD CONSTRAINT "AssetBorrow_fixedAssetId_fkey" FOREIGN KEY ("fixedAssetId") REFERENCES "public"."FixedAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetBorrow" ADD CONSTRAINT "AssetBorrow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_fixedAssetId_fkey" FOREIGN KEY ("fixedAssetId") REFERENCES "public"."FixedAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."materials_legacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
