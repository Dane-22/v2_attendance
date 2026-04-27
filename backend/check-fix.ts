import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const branchCode = 'A';
    const employeeId = 72; // Randy Aton
    
    console.log(`Simulating fix for Randy Aton (ID: ${employeeId}) transfer to branch ${branchCode}`);
    
    // 1. Get branch
    const destinationBranch = await prisma.branches.findUnique({
      where: { branch_code: branchCode }
    });
    
    if (!destinationBranch) {
      console.error('Destination branch not found');
      return;
    }
    
    console.log('Destination branch:', destinationBranch.branch_name);

    // 2. Perform update
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        branchCode: branchCode,
        branchName: destinationBranch.branch_name,
        branchId: destinationBranch.id
      }
    });

    console.log('Update result:', {
      id: updatedEmployee.id,
      branchCode: updatedEmployee.branchCode,
      branchName: updatedEmployee.branchName,
      branchId: updatedEmployee.branchId
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
