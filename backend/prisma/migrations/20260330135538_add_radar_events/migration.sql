-- CreateTable
CREATE TABLE "radar_events" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "radar_events_pkey" PRIMARY KEY ("id")
);
