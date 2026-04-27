import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkEmployeeSchema() {
  try {
    console.log('--- FETCHING ONE EMPLOYEE RAW ---');
    // Using raw SQL to see exactly what columns are in the database
    const rawResult: any[] = await prisma.$queryRaw`SELECT * FROM employees LIMIT 1`;
    if (rawResult.length > 0) {
      console.log('Columns in employees table:', Object.keys(rawResult[0]));
      console.log('Full sample record:', JSON.stringify(rawResult[0], null, 2));
    } else {
      console.log('No employees found to check columns.');
    }
  } catch (error: any) {
    console.error('Error checking schema:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployeeSchema();
