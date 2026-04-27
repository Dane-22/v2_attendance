import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function getPhilippinesDateRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  return { start, end };
}

async function main() {
  try {
    const employeeId = 72; // Randy Aton
    const { start, end } = getPhilippinesDateRange();
    
    console.log(`Checking active attendance for employee ${employeeId} on ${start.toISOString()}`);
    
    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employeeId,
        date: {
          gte: start,
          lt: end
        },
        check_in: { not: null },
        check_out: null
      }
    });

    console.log('Active attendance found:', activeAttendance);

    console.log('\nAll attendance records for this employee today:');
    const allToday = await prisma.attendance.findMany({
      where: {
        employeeId: employeeId,
        date: {
          gte: start,
          lt: end
        }
      }
    });
    console.log(JSON.stringify(allToday, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
