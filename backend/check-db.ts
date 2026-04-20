import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.attendance.count();
  console.log('Total attendance records:', count);
  
  const records = await prisma.attendance.findMany({ take: 5 });
  console.log('Sample records:');
  records.forEach(r => {
    console.log(`  ID: ${r.id}, Employee: ${r.employeeId}, Date: ${r.date}, Status: ${r.status}, CheckIn: ${r.check_in}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
