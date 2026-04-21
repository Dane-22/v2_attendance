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
  
  // Check specific codes
  const codes = ['E0001', 'E0002', 'W0001', 'W0002'];
  console.log('\nChecking specific codes:');
  for (const code of codes) {
    const emp = await prisma.employee.findUnique({
      where: { employeeCode: code }
    });
    console.log(`  ${code}: ${emp ? 'FOUND' : 'NOT FOUND'}`);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
