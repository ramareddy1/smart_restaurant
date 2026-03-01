-- CreateEnum
CREATE TYPE "PrepTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "cook_time_min" INTEGER,
ADD COLUMN     "difficulty_level" TEXT,
ADD COLUMN     "prep_time_min" INTEGER;

-- CreateTable
CREATE TABLE "allergens" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "allergens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_allergens" (
    "ingredient_id" TEXT NOT NULL,
    "allergen_id" TEXT NOT NULL,

    CONSTRAINT "ingredient_allergens_pkey" PRIMARY KEY ("ingredient_id","allergen_id")
);

-- CreateTable
CREATE TABLE "prep_tasks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "recipe_id" TEXT,
    "assigned_to_id" TEXT,
    "scheduled_for" TIMESTAMP(3) NOT NULL,
    "estimated_min" INTEGER,
    "status" "PrepTaskStatus" NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prep_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "allergens_name_key" ON "allergens"("name");

-- CreateIndex
CREATE INDEX "prep_tasks_scheduled_for_idx" ON "prep_tasks"("scheduled_for");

-- CreateIndex
CREATE INDEX "prep_tasks_status_idx" ON "prep_tasks"("status");

-- CreateIndex
CREATE INDEX "prep_tasks_assigned_to_id_idx" ON "prep_tasks"("assigned_to_id");

-- AddForeignKey
ALTER TABLE "ingredient_allergens" ADD CONSTRAINT "ingredient_allergens_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_allergens" ADD CONSTRAINT "ingredient_allergens_allergen_id_fkey" FOREIGN KEY ("allergen_id") REFERENCES "allergens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prep_tasks" ADD CONSTRAINT "prep_tasks_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prep_tasks" ADD CONSTRAINT "prep_tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
