import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAttendanceAll() {
  try {
    console.log('--- FETCHING LAST 10 ATTENDANCE RECORDS ---');
    const records = await prisma.attendance.findMany({
      orderBy: { id: 'desc' },
      take: 10
    });
    console.log(JSON.stringify(records, null, 2));

    console.log('\n--- FETCHING LAST 10 EMPLOYEE IDS ---');
    const employees = await prisma.employee.findMany({
      orderBy: { id: 'desc' },
      take: 10,
      select: { id: true, firstName: true, lastName: true, branchCode: true }
    });
    console.log(JSON.stringify(employees, null, 2));

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAttendanceAll();
