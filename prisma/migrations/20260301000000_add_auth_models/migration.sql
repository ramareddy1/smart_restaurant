-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'KITCHEN_MANAGER', 'HEAD_CHEF', 'SERVER', 'HOST');

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_settings" (
    "id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "target_food_cost" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "target_labor_cost" DOUBLE PRECISION NOT NULL DEFAULT 0.28,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "fiscal_year_start" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "restaurant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "pin" TEXT,
    "restaurant_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_settings_restaurant_id_key" ON "restaurant_settings"("restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_restaurant_id_idx" ON "users"("restaurant_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex (missing indexes on existing tables)
CREATE INDEX IF NOT EXISTS "alerts_is_read_is_dismissed_idx" ON "alerts"("is_read", "is_dismissed");

CREATE INDEX IF NOT EXISTS "ingredients_name_idx" ON "ingredients"("name");

CREATE INDEX IF NOT EXISTS "ingredients_category_idx" ON "ingredients"("category");

CREATE INDEX IF NOT EXISTS "ingredients_expiration_date_idx" ON "ingredients"("expiration_date");

CREATE INDEX IF NOT EXISTS "ingredients_supplier_id_idx" ON "ingredients"("supplier_id");

-- AddForeignKey
ALTER TABLE "restaurant_settings" ADD CONSTRAINT "restaurant_settings_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
