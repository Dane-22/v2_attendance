import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkEmployeeSchema() {
  try {
    const employeeId = 126;
    console.log(`--- Checking Employee ${employeeId} ---`);
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });
    console.log('Employee data:', JSON.stringify(employee, null, 2));

    if (employee) {
      console.log('\n--- Attempting Update ---');
      // Test update with problematic fields
      try {
        const updateData = {
          branchCode: employee.branchCode,
          branchName: employee.branchName,
          branchId: employee.branchId
        };
        console.log('Update data:', JSON.stringify(updateData, null, 2));
        
        const updated = await prisma.employee.update({
          where: { id: employeeId },
          data: updateData
        });
        console.log('Update successful');
      } catch (updateError: any) {
        console.error('Update failed:', updateError.message);
        if (updateError.code) console.error('Error code:', updateError.code);
        if (updateError.meta) console.error('Error meta:', updateError.meta);
      }
    } else {
      console.log('Employee not found');
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployeeSchema();
