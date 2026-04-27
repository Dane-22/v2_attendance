
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTransfer() {
  const employeeId = 126; // From the user's error message
  const targetBranchCode = 'Sto. Rosario (A)'; // From the user's screenshot
  
  console.log(`Testing transfer for employee ${employeeId} to branch ${targetBranchCode}`);
  
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });
    
    if (!employee) {
      console.error('Employee not found');
      return;
    }
    
    console.log('Current employee data:', {
      id: employee.id,
      branchCode: employee.branchCode,
      branchName: employee.branchName,
      branchId: employee.branchId
    });
    
    const destinationBranch = await prisma.branches.findUnique({
      where: { branch_code: targetBranchCode }
    });
    
    if (!destinationBranch) {
      console.error('Destination branch not found');
      return;
    }
    
    console.log('Destination branch found:', destinationBranch);
    
    console.log('Attempting update...');
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        branchCode: targetBranchCode,
        branchName: destinationBranch.branch_name,
        branchId: destinationBranch.id
      }
    });
    
    console.log('Update successful:', updatedEmployee);
    
  } catch (error: any) {
    console.error('Update failed with error:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTransfer();
