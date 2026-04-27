import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const employeeName = 'RANDY ATON';
    console.log(`Checking employee ${employeeName}...`);
    
    const randy = await prisma.employee.findFirst({
      where: {
        firstName: 'RANDY',
        lastName: 'ATON'
      }
    });

    if (!randy) {
      console.log('Randy Aton not found by name.');
      return;
    }

    console.log('Employee found:', {
      id: randy.id,
      code: randy.employeeCode,
      branch: randy.branchCode
    });

    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const todayEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));

    console.log(`Checking active attendance for ${todayStart.toISOString()}...`);
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: randy.id,
        date: {
          gte: todayStart,
          lt: todayEnd
        },
        check_in: { not: null },
        check_out: null
      }
    });

    console.log('Active attendance:', activeAttendance);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
