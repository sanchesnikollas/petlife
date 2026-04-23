-- CreateEnum
CREATE TYPE "AgeRange" AS ENUM ('PUPPY', 'ADULT', 'SENIOR', 'ALL_AGES');

-- CreateEnum
CREATE TYPE "SizeRange" AS ENUM ('MINI', 'SMALL', 'MEDIUM', 'LARGE', 'GIANT', 'ALL_SIZES');

-- CreateTable
CREATE TABLE "food_brands" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "line" TEXT NOT NULL,
    "type" "FoodType" NOT NULL,
    "species" "Species" NOT NULL,
    "ageRange" "AgeRange" NOT NULL DEFAULT 'ALL_AGES',
    "sizeRange" "SizeRange" NOT NULL DEFAULT 'ALL_SIZES',
    "kcalPer100g" DOUBLE PRECISION NOT NULL,
    "proteinPct" DOUBLE PRECISION,
    "fatPct" DOUBLE PRECISION,
    "fiberPct" DOUBLE PRECISION,
    "moisturePct" DOUBLE PRECISION,
    "brazilianBrand" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_brands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "food_brands_species_type_idx" ON "food_brands"("species", "type");

-- CreateIndex
CREATE INDEX "food_brands_brand_idx" ON "food_brands"("brand");
