import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany({
    take: 20,
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      status: true
    }
  });
  
  console.log('Employees in database:');
  employees.forEach(e => {
    console.log(`  ${e.employeeCode || 'NULL'} - ${e.firstName || ''} ${e.lastName || ''} (Status: ${e.status})`);
  });
  
  // Check specific ID 126
  console.log('\nChecking ID 126:');
  const emp126 = await prisma.employee.findUnique({
    where: { id: 126 }
  });
  console.log(`  ID 126: ${emp126 ? 'FOUND (' + emp126.employeeCode + ')' : 'NOT FOUND'}`);

  // List branches
  console.log('\nBranches:');
  const branches = await prisma.branches.findMany();
  branches.forEach(b => {
    console.log(`  ${b.branch_code} - ${b.branch_name} (ID: ${b.id})`);
  });
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
