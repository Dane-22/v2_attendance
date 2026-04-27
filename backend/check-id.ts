import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const employeeId = 126;
    console.log(`Searching for employee ID ${employeeId} in raw SQL...`);
    
    // 1. Search in employees table
    const empRaw = await prisma.$queryRaw`SELECT * FROM employees WHERE id = ${employeeId}`;
    console.log('Employees table result:', empRaw);

    // 2. Search in admins table (just in case)
    const adminRaw = await prisma.$queryRaw`SELECT * FROM admins WHERE id = ${employeeId}`;
    console.log('Admins table result:', adminRaw);

    // 3. Search in branch_users table (just in case)
    const buRaw = await prisma.$queryRaw`SELECT * FROM branch_users WHERE id = ${employeeId}`;
    console.log('Branch users table result:', buRaw);

    // 4. List some valid employee IDs to see the range
    const someEmps = await prisma.employee.findMany({
      take: 10,
      select: { id: true, firstName: true, lastName: true }
    });
    console.log('\nSample valid employee IDs:', someEmps);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
