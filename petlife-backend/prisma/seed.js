import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const TEST_EMAIL = 'test@petlife.com';
const TEST_PASSWORD = 'senha123';
const TEST_NAME = 'Usuário Teste';

async function seedTestUser() {
  const existing = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (existing) {
    console.log(`Test user already exists: ${TEST_EMAIL}`);
    return;
  }
  const passwordHash = await hashPassword(TEST_PASSWORD);
  await prisma.user.create({
    data: { name: TEST_NAME, email: TEST_EMAIL, passwordHash },
  });
  console.log(`Created test user: ${TEST_EMAIL} / ${TEST_PASSWORD}`);
}

async function seedFoodBrands() {
  const raw = readFileSync(join(__dirname, 'data', 'foodBrands.json'), 'utf8');
  const brands = JSON.parse(raw);
  const currentCount = await prisma.foodBrand.count();
  if (currentCount >= brands.length) {
    console.log(`FoodBrand already seeded (${currentCount} entries).`);
    return;
  }
  await prisma.foodBrand.deleteMany();
  await prisma.foodBrand.createMany({
    data: brands.map((b) => ({ ...b, brazilianBrand: true })),
  });
  console.log(`Seeded ${brands.length} food brands.`);
}

async function seedGroups() {
  const raw = readFileSync(join(__dirname, 'data', 'groups.json'), 'utf8');
  const groups = JSON.parse(raw);
  const existing = await prisma.group.count();
  if (existing >= groups.length) {
    console.log(`Groups already seeded (${existing}).`);
    return;
  }
  for (const g of groups) {
    await prisma.group.upsert({
      where: { slug: g.slug },
      update: {},
      create: g,
    });
  }
  console.log(`Seeded ${groups.length} groups.`);
}

async function main() {
  console.log('Seeding database...');
  await seedTestUser();
  await seedFoodBrands();
  await seedGroups();
  const [userCount, foodCount, groupCount] = await Promise.all([
    prisma.user.count(),
    prisma.foodBrand.count(),
    prisma.group.count(),
  ]);
  console.log(`Users: ${userCount} | Food brands: ${foodCount} | Groups: ${groupCount}`);
  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
