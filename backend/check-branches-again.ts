import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- EMPLOYEES BY BRANCH ---');
    const branches = await prisma.employee.groupBy({
      by: ['branchCode'],
      _count: {
        id: true
      }
    });
    console.log(JSON.stringify(branches, null, 2));

    console.log('\n--- SAMPLE EMPLOYEES FROM EACH BRANCH ---');
    for (const b of branches) {
      const sample = await prisma.employee.findFirst({
        where: { branchCode: b.branchCode },
        select: { id: true, firstName: true, lastName: true, branchCode: true, branchName: true }
      });
      console.log(JSON.stringify(sample, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
