-- CreateIndex
CREATE INDEX "AssetBorrow_status_idx" ON "public"."AssetBorrow"("status");

-- CreateIndex
CREATE INDEX "AssetBorrow_fixedAssetId_idx" ON "public"."AssetBorrow"("fixedAssetId");

-- CreateIndex
CREATE INDEX "ConsumableMaterial_currentStock_minStock_idx" ON "public"."ConsumableMaterial"("currentStock", "minStock");

-- CreateIndex
CREATE INDEX "ConsumableMaterial_category_idx" ON "public"."ConsumableMaterial"("category");

-- CreateIndex
CREATE INDEX "ConsumableTransaction_createdAt_idx" ON "public"."ConsumableTransaction"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ConsumableTransaction_type_createdAt_idx" ON "public"."ConsumableTransaction"("type", "createdAt");

-- CreateIndex
CREATE INDEX "ConsumableTransaction_userId_idx" ON "public"."ConsumableTransaction"("userId");

-- CreateIndex
CREATE INDEX "FixedAsset_condition_idx" ON "public"."FixedAsset"("condition");

-- CreateIndex
CREATE INDEX "FixedAsset_category_idx" ON "public"."FixedAsset"("category");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "public"."Notification"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "public"."Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "PurchaseRequest_status_idx" ON "public"."PurchaseRequest"("status");

-- CreateIndex
CREATE INDEX "PurchaseRequest_requesterId_idx" ON "public"."PurchaseRequest"("requesterId");
