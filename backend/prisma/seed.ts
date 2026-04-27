import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Check if admin already exists
  const existingAdmin = await prisma.admins.findUnique({
    where: { username: 'admin' }
  });

  if (existingAdmin) {
    console.log('Admin user already exists, updating password hash to bcrypt...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.admins.update({
      where: { username: 'admin' },
      data: { password: passwordHash }
    });
    console.log('Admin password updated');
  } else {
    // Create default admin user
    // Password: admin123
    // Bcrypt hash of "admin123"
    const passwordHash = await bcrypt.hash('admin123', 10);
    
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
