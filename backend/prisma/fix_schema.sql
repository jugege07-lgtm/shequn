ALTER TABLE "business_categories" ADD COLUMN "code" TEXT;
UPDATE "business_categories" SET "code" = 'cat_' || id;
CREATE UNIQUE INDEX "business_categories_code_key" ON "business_categories"("code");
ALTER TABLE "point_rules" ADD COLUMN "rule_group" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "point_rules" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;
