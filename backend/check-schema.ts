import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log('=== CHECKING DATABASE SCHEMA ===\n');
    
    // Check attendance table structure
    const attendanceColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'attendance'
      ORDER BY ORDINAL_POSITION
    `;
    
    console.log('ATTENDANCE TABLE COLUMNS:');
    console.log(attendanceColumns);
    
    // Check employees table structure  
    const employeeColumns = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'employees'
      ORDER BY ORDINAL_POSITION
    `;
    
    console.log('\nEMPLOYEES TABLE COLUMNS:');
    console.log(employeeColumns);
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
