import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Check raw date values from database
  const records = await prisma.attendance.findMany({
    take: 5,
    orderBy: { id: 'desc' }
  });
  
  console.log('=== RAW DATABASE RECORDS ===');
  records.forEach(r => {
    console.log(`\nID: ${r.id}`);
    console.log(`  employeeId: ${r.employeeId}`);
    console.log(`  date (raw): ${r.date}`);
    console.log(`  date (toISOString): ${new Date(r.date).toISOString()}`);
    console.log(`  date (getTime): ${new Date(r.date).getTime()}`);
    console.log(`  check_in: ${r.check_in}`);
    console.log(`  check_out: ${r.check_out}`);
    console.log(`  status: ${r.status}`);
    console.log(`  branch_code: ${r.branch_code}`);
  });
  
  // Test date query with different formats
  const testDate = new Date('2026-04-20');
  const utcDate = new Date(Date.UTC(testDate.getFullYear(), testDate.getMonth(), testDate.getDate()));
  
  console.log('\n=== DATE COMPARISON ===');
  console.log(`Input date string: 2026-04-20`);
  console.log(`testDate (local): ${testDate}`);
  console.log(`utcDate: ${utcDate}`);
  console.log(`utcDate ISO: ${utcDate.toISOString()}`);
  console.log(`utcDate getTime: ${utcDate.getTime()}`);
  
  // Query with the exact same logic as the controller
  const where = { date: utcDate };
  console.log('\nQuery where clause:', where);
  
  const found = await prisma.attendance.findMany({ where });
  console.log(`\nQuery result: ${found.length} records found`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
