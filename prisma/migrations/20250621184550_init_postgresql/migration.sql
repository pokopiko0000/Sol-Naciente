-- CreateEnum
CREATE TYPE "LiveType" AS ENUM ('KUCHIBE', 'NIWARA');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'WAITING', 'CANCELLED');

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "entryNumber" INTEGER NOT NULL DEFAULT 1,
    "name1" TEXT NOT NULL,
    "representative1" TEXT NOT NULL,
    "preference1_1" TEXT,
    "preference1_2" TEXT,
    "preference1_3" TEXT,
    "name2" TEXT,
    "representative2" TEXT,
    "preference2_1" TEXT,
    "preference2_2" TEXT,
    "preference2_3" TEXT,
    "email" TEXT NOT NULL,
    "lineUrl" TEXT,
    "liveType" "LiveType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Live" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "LiveType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Live_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "liveId" TEXT NOT NULL,
    "nameIndex" INTEGER NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "order" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_entryId_liveId_nameIndex_key" ON "Assignment"("entryId", "liveId", "nameIndex");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "Entry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_liveId_fkey" FOREIGN KEY ("liveId") REFERENCES "Live"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
