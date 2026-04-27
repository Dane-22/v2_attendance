import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- ADMINS TABLE BRANCH CODES ---');
    const admins = await prisma.admins.findMany({
      where: { branch_code: { not: null } },
      select: { id: true, name: true, branch_code: true }
    });
    console.log(JSON.stringify(admins, null, 2));

    console.log('\n--- BRANCHES TABLE ---');
    const branches = await prisma.branches.findMany();
    console.log(JSON.stringify(branches, null, 2));

    console.log('\n--- BRANCH CODE COMPARISON ---');
    const adminCodes = new Set(admins.map(a => a.branch_code));
    const branchCodes = new Set(branches.map(b => b.branch_code));
    
    console.log('Codes in admins table:', [...adminCodes]);
    console.log('Codes in branches table:', [...branchCodes]);
    
    const missingInBranches = [...adminCodes].filter(c => c && !branchCodes.has(c));
    if (missingInBranches.length > 0) {
      console.log('CRITICAL: Codes in admins NOT found in branches table:', missingInBranches);
    } else {
      console.log('All admin branch codes exist in branches table.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
