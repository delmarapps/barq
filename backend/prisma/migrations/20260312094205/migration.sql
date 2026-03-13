-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'AR');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('walking', 'running', 'cycling', 'strength', 'yoga', 'swimming', 'other');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('weight_loss', 'build_strength', 'better_sleep', 'less_stress', 'more_active');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('recovery', 'activity', 'sleep', 'challenge', 'system');

-- CreateEnum
CREATE TYPE "HrZoneName" AS ENUM ('rest', 'easy', 'aerobic', 'threshold', 'max');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "full_name_ar" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "gender" "Gender",
    "weight_kg" DOUBLE PRECISION,
    "height_cm" DOUBLE PRECISION,
    "language_preference" "Language" NOT NULL DEFAULT 'EN',
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "device_serial" TEXT,
    "firmware_version" TEXT,
    "battery_level" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wellness_scores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "overall_score" DOUBLE PRECISION NOT NULL,
    "recovery_score" DOUBLE PRECISION NOT NULL,
    "strain_score" DOUBLE PRECISION NOT NULL,
    "sleep_score" DOUBLE PRECISION NOT NULL,
    "recommendation" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wellness_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recovery_score" DOUBLE PRECISION NOT NULL,
    "hrv_ms" DOUBLE PRECISION,
    "resting_hr_bpm" INTEGER,
    "skin_temp_deviation" DOUBLE PRECISION,
    "blood_oxygen_pct" DOUBLE PRECISION,
    "respiratory_rate" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recovery_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sleep_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sleep_start" TIMESTAMP(3) NOT NULL,
    "sleep_end" TIMESTAMP(3) NOT NULL,
    "total_minutes" INTEGER NOT NULL,
    "awake_minutes" INTEGER NOT NULL DEFAULT 0,
    "light_minutes" INTEGER NOT NULL DEFAULT 0,
    "deep_minutes" INTEGER NOT NULL DEFAULT 0,
    "rem_minutes" INTEGER NOT NULL DEFAULT 0,
    "sleep_score" DOUBLE PRECISION NOT NULL,
    "sleep_performance_pct" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sleep_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_type" "ActivityType" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "strain_points" DOUBLE PRECISION,
    "avg_hr_bpm" INTEGER,
    "max_hr_bpm" INTEGER,
    "calories_burned" INTEGER,
    "steps" INTEGER,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_zones" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "zone_name" "HrZoneName" NOT NULL,
    "minutes_in_zone" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "hr_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "goal_type" "GoalType" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "target_value" DOUBLE PRECISION,
    "unit" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_ar" TEXT NOT NULL,
    "body_en" TEXT NOT NULL,
    "body_ar" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "wellness_scores_user_id_date_key" ON "wellness_scores"("user_id", "date");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wellness_scores" ADD CONSTRAINT "wellness_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_metrics" ADD CONSTRAINT "recovery_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sleep_sessions" ADD CONSTRAINT "sleep_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_sessions" ADD CONSTRAINT "activity_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_zones" ADD CONSTRAINT "hr_zones_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "activity_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
