import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const rawAll = await prisma.$queryRaw`SELECT id FROM employees ORDER BY id ASC`;
    console.log('All IDs in employees table:', (rawAll as any[]).map(r => r.id).join(', '));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
