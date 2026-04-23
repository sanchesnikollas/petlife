import { prisma } from '../lib/prisma.js';
import { AppError } from '../plugins/errorHandler.js';

function ageInMonths(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

function classifyLifeStage(species, months) {
  if (months == null) return 'ADULT';
  if (species === 'DOG') {
    if (months < 12) return 'PUPPY';
    if (months >= 84) return 'SENIOR';
    return 'ADULT';
  }
  // CAT
  if (months < 12) return 'PUPPY';
  if (months >= 132) return 'SENIOR';
  return 'ADULT';
}

function derFactor({ species, lifeStage, neutered, activityLevel }) {
  if (species === 'DOG') {
    if (lifeStage === 'PUPPY') return 2.0;
    if (lifeStage === 'SENIOR') return neutered ? 1.2 : 1.4;
    // ADULT
    const base = neutered ? 1.6 : 1.8;
    if (activityLevel === 'HIGH') return base + 0.2;
    if (activityLevel === 'LOW') return base - 0.2;
    return base;
  }
  // CAT
  if (lifeStage === 'PUPPY') return 2.5;
  if (lifeStage === 'SENIOR') return 1.1;
  const base = neutered ? 1.2 : 1.4;
  if (activityLevel === 'HIGH') return base + 0.1;
  if (activityLevel === 'LOW') return base - 0.1;
  return base;
}

function calculateNutrition({ species, weightKg, lifeStage, neutered, activityLevel, kcalPer100g }) {
  // Resting Energy Requirement (NRC)
  const rer = 70 * Math.pow(weightKg, 0.75);
  const factor = derFactor({ species, lifeStage, neutered, activityLevel });
  const der = Math.round(rer * factor);

  // Grams per day based on food energy density
  const gramsPerDay = kcalPer100g ? Math.round((der / kcalPer100g) * 100) : null;

  // Meals per day recommendation
  const mealsPerDay = lifeStage === 'PUPPY' ? 3 : 2;
  const portionGrams = gramsPerDay ? Math.round(gramsPerDay / mealsPerDay) : null;

  return {
    rerKcal: Math.round(rer),
    dailyKcal: der,
    gramsPerDay,
    mealsPerDay,
    portionGrams,
    factor,
    lifeStage,
  };
}

export default async function nutritionRoutes(fastify) {
  // POST /pets/:petId/nutrition
  // body: { activityLevel?, foodBrandId? }
  fastify.post('/pets/:petId/nutrition', { preHandler: [fastify.verifyPetOwnership] }, async (request) => {
    const pet = await prisma.pet.findUnique({
      where: { id: request.params.petId },
    });
    if (!pet) throw new AppError(404, 'NOT_FOUND', 'Pet not found');
    if (!pet.weight) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Pet weight is required to calculate nutrition');
    }

    const body = request.body || {};
    const activityLevel = body.activityLevel || pet.activityLevel || 'MODERATE';

    let kcalPer100g = null;
    let brand = null;
    if (body.foodBrandId) {
      brand = await prisma.foodBrand.findUnique({ where: { id: body.foodBrandId } });
      if (!brand) throw new AppError(404, 'NOT_FOUND', 'Food brand not found');
      kcalPer100g = brand.kcalPer100g;
    }

    const months = ageInMonths(pet.birthDate);
    const lifeStage = classifyLifeStage(pet.species, months);

    const result = calculateNutrition({
      species: pet.species,
      weightKg: Number(pet.weight),
      lifeStage,
      neutered: Boolean(pet.neutered),
      activityLevel,
      kcalPer100g,
    });

    return {
      data: {
        ...result,
        weightKg: Number(pet.weight),
        neutered: Boolean(pet.neutered),
        activityLevel,
        ageMonths: months,
        foodBrand: brand,
      },
    };
  });
}
