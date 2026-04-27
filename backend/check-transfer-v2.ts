import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTransferDetails() {
  try {
    const employeeId = 126; // The ID from user error
    console.log(`--- INVESTIGATING EMPLOYEE ID ${employeeId} ---`);
    
    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      console.log(`Employee ID ${employeeId} not found in database.`);
      
      // Let's find some high IDs
      const highIds = await prisma.employee.findMany({
        orderBy: { id: 'desc' },
        take: 5
      });
      console.log('Highest 5 employee IDs in database:', highIds.map(e => e.id));
      return;
    }

    console.log('Employee data:', JSON.stringify(employee, null, 2));

    // Check branches
    console.log('\n--- CHECKING BRANCHES ---');
    const branches = await prisma.branches.findMany();
    console.log('Available branches:', branches.map(b => `${b.branch_code}: ${b.branch_name} (ID: ${b.id})`));

    // Check attendance for today
    console.log('\n--- CHECKING TODAY ATTENDANCE ---');
    const now = new Date();
    // Use the same logic as the controller
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
    const start = new Date(Date.UTC(year, month, day));
    const end = new Date(Date.UTC(year, month, day + 1));

    console.log(`Date range: ${start.toISOString()} to ${end.toISOString()}`);

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

    console.log('Active attendance:', activeAttendance);

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransferDetails();
