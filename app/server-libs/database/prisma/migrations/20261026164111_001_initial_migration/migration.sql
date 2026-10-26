-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('PLAYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CosmeticSlots" AS ENUM ('HAT', 'BACKGROUND', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "CosmeticRarity" AS ENUM ('COMMON', 'RARE', 'EPIC');

-- CreateEnum
CREATE TYPE "EffectTypes" AS ENUM ('CLICK_POWER', 'AUTO_INCOME');

-- CreateEnum
CREATE TYPE "AchievmentConditions" AS ENUM ('TOTAL_CLICKS', 'TOTAL_FEEDS', 'LEVEL', 'TOTAL_COINS_EARNED', 'STREAK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nickname" VARCHAR(70) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "role" "Roles" NOT NULL DEFAULT 'PLAYER',
    "last_login_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(70) NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "hunger" SMALLINT NOT NULL DEFAULT 100,
    "mood" SMALLINT NOT NULL DEFAULT 100,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players_statistics" (
    "id" TEXT NOT NULL,
    "coins" BIGINT NOT NULL DEFAULT 0,
    "total_coins_earned" BIGINT NOT NULL DEFAULT 0,
    "total_clicks" BIGINT NOT NULL DEFAULT 0,
    "total_feeds" BIGINT NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "click_power" INTEGER NOT NULL DEFAULT 1,
    "auto_income" INTEGER NOT NULL DEFAULT 0,
    "player_id" TEXT NOT NULL,
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(70) NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "hunger_restore" INTEGER NOT NULL,
    "mood_bonus" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_in_inventory" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "food_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_in_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cosmetics" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(70) NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "slot" "CosmeticSlots" NOT NULL,
    "rarity" "CosmeticRarity" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cosmetics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cosmetic_in_inventory" (
    "id" TEXT NOT NULL,
    "is_equipped" BOOLEAN NOT NULL DEFAULT false,
    "cosmetic_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cosmetic_in_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upgrades" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(70) NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "effect_type" "EffectTypes" NOT NULL,
    "effect_value" INTEGER NOT NULL,
    "base_price" INTEGER NOT NULL,
    "price_multiplier" DECIMAL(10,4) NOT NULL DEFAULT 1.0,
    "max_level" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upgrades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_upgrades" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "user_id" TEXT NOT NULL,
    "upgrade_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_upgrades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievments" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(70) NOT NULL,
    "title" VARCHAR(70) NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "condition_type" "AchievmentConditions" NOT NULL,
    "condition_value" INTEGER NOT NULL,
    "reward_coins" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "achievment_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_reward_config" (
    "id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "reward_coins" INTEGER NOT NULL,
    "reward_item_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_reward_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_streaks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "best_streak" INTEGER NOT NULL DEFAULT 0,
    "last_claim_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" VARCHAR(70) NOT NULL,
    "target_user_id" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");

-- CreateIndex
CREATE INDEX "users_last_login_at_idx" ON "users"("last_login_at");

-- CreateIndex
CREATE INDEX "users_is_blocked_idx" ON "users"("is_blocked");

-- CreateIndex
CREATE UNIQUE INDEX "pets_user_id_key" ON "pets"("user_id");

-- CreateIndex
CREATE INDEX "pets_xp_idx" ON "pets"("xp");

-- CreateIndex
CREATE INDEX "pets_level_idx" ON "pets"("level");

-- CreateIndex
CREATE UNIQUE INDEX "players_statistics_player_id_key" ON "players_statistics"("player_id");

-- CreateIndex
CREATE INDEX "players_statistics_total_coins_earned_idx" ON "players_statistics"("total_coins_earned");

-- CreateIndex
CREATE INDEX "players_statistics_total_clicks_idx" ON "players_statistics"("total_clicks");

-- CreateIndex
CREATE INDEX "food_mood_bonus_idx" ON "food"("mood_bonus");

-- CreateIndex
CREATE INDEX "food_hunger_restore_idx" ON "food"("hunger_restore");

-- CreateIndex
CREATE INDEX "food_is_active_idx" ON "food"("is_active");

-- CreateIndex
CREATE INDEX "food_price_idx" ON "food"("price");

-- CreateIndex
CREATE INDEX "food_in_inventory_quantity_idx" ON "food_in_inventory"("quantity");

-- CreateIndex
CREATE INDEX "food_in_inventory_user_id_idx" ON "food_in_inventory"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "food_in_inventory_food_id_user_id_key" ON "food_in_inventory"("food_id", "user_id");

-- CreateIndex
CREATE INDEX "cosmetics_price_idx" ON "cosmetics"("price");

-- CreateIndex
CREATE INDEX "cosmetics_is_active_idx" ON "cosmetics"("is_active");

-- CreateIndex
CREATE INDEX "cosmetics_slot_idx" ON "cosmetics"("slot");

-- CreateIndex
CREATE INDEX "cosmetics_rarity_idx" ON "cosmetics"("rarity");

-- CreateIndex
CREATE INDEX "cosmetic_in_inventory_user_id_idx" ON "cosmetic_in_inventory"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cosmetic_in_inventory_cosmetic_id_user_id_key" ON "cosmetic_in_inventory"("cosmetic_id", "user_id");

-- CreateIndex
CREATE INDEX "upgrades_name_idx" ON "upgrades"("name");

-- CreateIndex
CREATE INDEX "upgrades_effect_type_idx" ON "upgrades"("effect_type");

-- CreateIndex
CREATE INDEX "upgrades_base_price_idx" ON "upgrades"("base_price");

-- CreateIndex
CREATE INDEX "user_upgrades_upgrade_id_idx" ON "user_upgrades"("upgrade_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_upgrades_user_id_upgrade_id_key" ON "user_upgrades"("user_id", "upgrade_id");

-- CreateIndex
CREATE UNIQUE INDEX "achievments_code_key" ON "achievments"("code");

-- CreateIndex
CREATE INDEX "achievments_title_idx" ON "achievments"("title");

-- CreateIndex
CREATE INDEX "achievments_condition_type_condition_value_idx" ON "achievments"("condition_type", "condition_value");

-- CreateIndex
CREATE INDEX "user_achievments_user_id_idx" ON "user_achievments"("user_id");

-- CreateIndex
CREATE INDEX "user_achievments_achievment_id_idx" ON "user_achievments"("achievment_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievments_user_id_achievment_id_key" ON "user_achievments"("user_id", "achievment_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_reward_config_day_number_key" ON "daily_reward_config"("day_number");

-- CreateIndex
CREATE UNIQUE INDEX "login_streaks_user_id_key" ON "login_streaks"("user_id");

-- CreateIndex
CREATE INDEX "admin_logs_admin_id_idx" ON "admin_logs"("admin_id");

-- CreateIndex
CREATE INDEX "admin_logs_target_user_id_idx" ON "admin_logs"("target_user_id");

-- CreateIndex
CREATE INDEX "admin_logs_action_idx" ON "admin_logs"("action");

-- CreateIndex
CREATE INDEX "admin_logs_created_at_idx" ON "admin_logs"("created_at");

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players_statistics" ADD CONSTRAINT "players_statistics_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_in_inventory" ADD CONSTRAINT "food_in_inventory_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_in_inventory" ADD CONSTRAINT "food_in_inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cosmetic_in_inventory" ADD CONSTRAINT "cosmetic_in_inventory_cosmetic_id_fkey" FOREIGN KEY ("cosmetic_id") REFERENCES "cosmetics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cosmetic_in_inventory" ADD CONSTRAINT "cosmetic_in_inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_upgrades" ADD CONSTRAINT "user_upgrades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_upgrades" ADD CONSTRAINT "user_upgrades_upgrade_id_fkey" FOREIGN KEY ("upgrade_id") REFERENCES "upgrades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievments" ADD CONSTRAINT "user_achievments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievments" ADD CONSTRAINT "user_achievments_achievment_id_fkey" FOREIGN KEY ("achievment_id") REFERENCES "achievments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reward_config" ADD CONSTRAINT "daily_reward_config_reward_item_id_fkey" FOREIGN KEY ("reward_item_id") REFERENCES "cosmetics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_streaks" ADD CONSTRAINT "login_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
