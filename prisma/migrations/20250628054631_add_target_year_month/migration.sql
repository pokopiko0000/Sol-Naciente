-- AlterTable
ALTER TABLE "Live" ADD COLUMN     "is_confirmed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "target_month" INTEGER,
ADD COLUMN     "target_year" INTEGER;
