-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "entry_start_time" TIMESTAMP(3) NOT NULL,
    "entry_end_time" TIMESTAMP(3) NOT NULL,
    "is_entry_active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
