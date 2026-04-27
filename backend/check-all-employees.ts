import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- LISTING ALL EMPLOYEES (ID, Name, Code) ---');
    const allEmployees = await prisma.employee.findMany({
      select: { id: true, firstName: true, lastName: true, employeeCode: true },
      orderBy: { id: 'asc' }
    });
    
    allEmployees.forEach(e => {
      console.log(`ID: ${e.id}, Code: ${e.employeeCode}, Name: ${e.firstName} ${e.lastName}`);
    });
    
    console.log(`\nTotal count: ${allEmployees.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
