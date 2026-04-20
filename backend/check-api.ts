import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Test the exact query from the controller
  const dateStr = '2026-04-20';
  const d = new Date(dateStr);
  const targetDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  
  console.log('Date string:', dateStr);
  console.log('Parsed date:', d);
  console.log('Target date (UTC):', targetDate);
  console.log('Target date ISO:', targetDate.toISOString());
  
  // Query with exact date match
  const records = await prisma.attendance.findMany({
    where: { date: targetDate },
    orderBy: { check_in: 'desc' }
  });
  
  console.log('\nRecords found:', records.length);
  records.forEach(r => {
    console.log(`  ID: ${r.id}, Employee: ${r.employeeId}, Date: ${r.date}, Status: ${r.status}`);
  });
  
  // Check what dates exist in the table
  console.log('\nAll distinct dates in attendance table:');
  const allRecords = await prisma.attendance.findMany({
    select: { date: true },
    distinct: ['date']
  });
  allRecords.forEach(r => {
    console.log(`  Date: ${r.date} (ISO: ${new Date(r.date).toISOString()})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
