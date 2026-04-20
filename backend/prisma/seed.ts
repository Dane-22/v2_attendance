import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function md5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex');
}

async function main() {
  console.log('Seeding database...');

  // Check if admin already exists
  const existingAdmin = await prisma.admins.findUnique({
    where: { username: 'admin' }
  });

  if (existingAdmin) {
    console.log('Admin user already exists');
  } else {
    // Create default admin user
    // Password: admin123
    // MD5 hash of "admin123"
    const passwordHash = md5('admin123');
    
    const admin = await prisma.admins.create({
      data: {
        username: 'admin',
        password: passwordHash,
        name: 'System Administrator',
        email: 'admin@jajr.com',
        role: 'super_admin',
        branch_code: 'HQ',
      },
    });
    console.log('Admin user created:', admin.username);
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
