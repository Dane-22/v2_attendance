import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Admin data from v1 (attendance_db.sql)
const admins = [
  { id: 1, username: 'admin', name: 'System Administrator', email: 'admin@jajr.com', password: '$2y$10$RSHOb3hskFZueMLlCycFuua/4EwcxGmAIzpcl8ixQpEXY3tfu9LYi', role: 'super_admin', branch_code: null },
  { id: 2, username: 'superadmin', name: 'Super Admin', email: 'superadmin@jajr.com', password: '$2y$10$RSHOb3hskFZueMLlCycFuua/4EwcxGmAIzpcl8ixQpEXY3tfu9LYi', role: 'super_admin', branch_code: null },
  { id: 3, username: 'branch-a', name: 'Branch A Admin', email: 'branch-a@jajr.com', password: '$2y$10$RSHOb3hskFZueMLlCycFuua/4EwcxGmAIzpcl8ixQpEXY3tfu9LYi', role: 'admin', branch_code: 'A' },
  { id: 4, username: 'branch-b', name: 'Branch B Admin', email: 'branch-b@jajr.com', password: '$2y$10$RSHOb3hskFZueMLlCycFuua/4EwcxGmAIzpcl8ixQpEXY3tfu9LYi', role: 'admin', branch_code: 'B' },
  { id: 5, username: 'branch-c', name: 'Branch C Admin', email: 'branch-c@jajr.com', password: '$2y$10$RSHOb3hskFZueMLlCycFuua/4EwcxGmAIzpcl8ixQpEXY3tfu9LYi', role: 'admin', branch_code: 'C' },
  { id: 6, username: 'branch-d', name: 'Branch D Admin', email: 'branch-d@jajr.com', password: '$2y$10$RSHOb3hskFZueMLlCycFuua/4EwcxGmAIzpcl8ixQpEXY3tfu9LYi', role: 'admin', branch_code: 'D' },
  { id: 7, username: 'branch-e', name: 'Branch E Admin', email: 'branch-e@jajr.com', password: '$2y$10$RSHOb3hskFZueMLlCycFuua/4EwcxGmAIzpcl8ixQpEXY3tfu9LYi', role: 'admin', branch_code: 'E' },
  { id: 8, username: 'branch-f', name: 'Branch F Admin', email: 'branch-f@jajr.com', password: '$2y$10$RSHOb3hskFZueMLlCycFuua/4EwcxGmAIzpcl8ixQpEXY3tfu9LYi', role: 'admin', branch_code: 'F' },
  { id: 9, username: 'branch-g', name: 'Branch G Admin', email: 'branch-g@jajr.com', password: '$2y$10$RSHOb3hskFZueMLlCycFuua/4EwcxGmAIzpcl8ixQpEXY3tfu9LYi', role: 'admin', branch_code: 'G' },
  { id: 10, username: 'branch-h', name: 'Branch H Admin', email: 'branch-h@jajr.com', password: '$2y$10$RSHOb3hskFZueMLlCycFuua/4EwcxGmAIzpcl8ixQpEXY3tfu9LYi', role: 'admin', branch_code: 'H' },
];

async function main() {
  console.log('Importing admins...');
  
  let imported = 0;
  let skipped = 0;
  
  for (const admin of admins) {
    try {
      // Check if admin already exists
      const existing = await prisma.admins.findUnique({
        where: { username: admin.username }
      });
      
      if (existing) {
        console.log(`Skipping ${admin.username} - already exists`);
        skipped++;
        continue;
      }
      
      await prisma.admins.create({
        data: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          email: admin.email,
          password: admin.password,
          role: admin.role as any,
          branch_code: admin.branch_code,
        }
      });
      
      console.log(`Imported: ${admin.username} - ${admin.name}`);
      imported++;
    } catch (error) {
      console.error(`Failed to import ${admin.username}:`, error);
    }
  }
  
  console.log(`\nDone! Imported: ${imported}, Skipped: ${skipped}`);
  console.log('\nDefault passwords: admin123 (for all accounts)');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
