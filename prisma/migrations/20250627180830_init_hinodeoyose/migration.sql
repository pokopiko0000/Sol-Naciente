/*
  Warnings:

  - You are about to drop the column `nameIndex` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `entryNumber` on the `Entry` table. All the data in the column will be lost.
  - You are about to drop the column `liveType` on the `Entry` table. All the data in the column will be lost.
  - You are about to drop the column `name1` on the `Entry` table. All the data in the column will be lost.
  - You are about to drop the column `name2` on the `Entry` table. All the data in the column will be lost.
  - You are about to drop the column `preference1_1` on the `Entry` table. All the data in the column will be lost.
  - You are about to drop the column `preference1_2` on the `Entry` table. All the data in the column will be lost.
  - You are about to drop the column `preference1_3` on the `Entry` table. All the data in the column will be lost.
  - You are about to drop the column `preference2_1` on the `Entry` table. All the data in the column will be lost.
  - You are about to drop the column `preference2_2` on the `Entry` table. All the data in the column will be lost.
  - You are about to drop the column `preference2_3` on the `Entry` table. All the data in the column will be lost.
  - You are about to drop the column `representative1` on the `Entry` table. All the data in the column will be lost.
  - You are about to drop the column `representative2` on the `Entry` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Live` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[entryId,liveId]` on the table `Assignment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `entry_name` to the `Entry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `indies_name` to the `Entry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `performance_type` to the `Entry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_date` to the `Entry` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Assignment_entryId_liveId_nameIndex_key";

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "nameIndex";

-- AlterTable
ALTER TABLE "Entry" DROP COLUMN "entryNumber",
DROP COLUMN "liveType",
DROP COLUMN "name1",
DROP COLUMN "name2",
DROP COLUMN "preference1_1",
DROP COLUMN "preference1_2",
DROP COLUMN "preference1_3",
DROP COLUMN "preference2_1",
DROP COLUMN "preference2_2",
DROP COLUMN "preference2_3",
DROP COLUMN "representative1",
DROP COLUMN "representative2",
ADD COLUMN     "entry_name" TEXT NOT NULL,
ADD COLUMN     "indies_name" TEXT NOT NULL,
ADD COLUMN     "performance_type" TEXT NOT NULL,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "target_date" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Live" DROP COLUMN "type",
ALTER COLUMN "capacity" SET DEFAULT 24;

-- DropEnum
DROP TYPE "LiveType";

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_entryId_liveId_key" ON "Assignment"("entryId", "liveId");
