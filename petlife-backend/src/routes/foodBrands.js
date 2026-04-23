import { prisma } from '../lib/prisma.js';
import { AppError } from '../plugins/errorHandler.js';

export default async function foodBrandRoutes(fastify) {
  // GET /food-brands?species=DOG&q=royal&type=DRY
  fastify.get('/food-brands', async (request) => {
    const { species, q, type, ageRange, sizeRange, limit = '50' } = request.query || {};

    const where = {};
    if (species && ['DOG', 'CAT'].includes(species)) where.species = species;
    if (type) where.type = type;
    if (ageRange) where.ageRange = ageRange;
    if (sizeRange) where.sizeRange = sizeRange;
    if (q && q.trim()) {
      where.OR = [
        { brand: { contains: q, mode: 'insensitive' } },
        { line: { contains: q, mode: 'insensitive' } },
      ];
    }

    const take = Math.min(parseInt(limit, 10) || 50, 200);

    const brands = await prisma.foodBrand.findMany({
      where,
      orderBy: [{ brand: 'asc' }, { line: 'asc' }],
      take,
    });

    return { data: brands };
  });

  // GET /food-brands/:id
  fastify.get('/food-brands/:id', async (request) => {
    const brand = await prisma.foodBrand.findUnique({
      where: { id: request.params.id },
    });
    if (!brand) {
      throw new AppError(404, 'NOT_FOUND', 'Food brand not found');
    }
    return { data: brand };
  });
}
