const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const emp = await prisma.employee.findFirst({
    where: { status: 'Active' },
    select: { id: true, employeeCode: true, branchCode: true, branchId: true }
  });
  console.log("TEST_EMPLOYEE_DATA:", JSON.stringify(emp));
}

main().finally(() => prisma.$disconnect());
