import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting admin passwords...');
  
  // Generate proper bcrypt hash for admin123
  const passwordHash = await bcrypt.hash('admin123', 10);
  console.log('Generated hash:', passwordHash);
  
  const admins = [
    { username: 'admin', name: 'System Administrator', email: 'admin@jajr.com', role: 'super_admin', branch_code: null },
    { username: 'superadmin', name: 'Super Admin', email: 'superadmin@jajr.com', role: 'super_admin', branch_code: null },
    { username: 'branch-a', name: 'Branch A Admin', email: 'branch-a@jajr.com', role: 'admin', branch_code: 'A' },
    { username: 'branch-b', name: 'Branch B Admin', email: 'branch-b@jajr.com', role: 'admin', branch_code: 'B' },
    { username: 'branch-c', name: 'Branch C Admin', email: 'branch-c@jajr.com', role: 'admin', branch_code: 'C' },
    { username: 'branch-d', name: 'Branch D Admin', email: 'branch-d@jajr.com', role: 'admin', branch_code: 'D' },
    { username: 'branch-e', name: 'Branch E Admin', email: 'branch-e@jajr.com', role: 'admin', branch_code: 'E' },
    { username: 'branch-f', name: 'Branch F Admin', email: 'branch-f@jajr.com', role: 'admin', branch_code: 'F' },
    { username: 'branch-g', name: 'Branch G Admin', email: 'branch-g@jajr.com', role: 'admin', branch_code: 'G' },
    { username: 'branch-h', name: 'Branch H Admin', email: 'branch-h@jajr.com', role: 'admin', branch_code: 'H' },
  ];
  
  for (const admin of admins) {
    try {
      // Delete existing if any
      await prisma.admins.deleteMany({
        where: { username: admin.username }
      });
      
      // Create with new password
      await prisma.admins.create({
        data: {
          username: admin.username,
          name: admin.name,
          email: admin.email,
          password: passwordHash,
          role: admin.role as any,
          branch_code: admin.branch_code,
        }
      });
      
      console.log(`Reset: ${admin.username} / admin123`);
    } catch (error) {
      console.error(`Failed for ${admin.username}:`, error);
    }
  }
  
  console.log('\nDone! All passwords are: admin123');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
