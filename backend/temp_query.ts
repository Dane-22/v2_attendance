import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ots = await prisma.overtimeRequest.findMany({
    where: {
      status: 'PENDING'
    }
  });

  console.log('Pending Overtime Requests:');
  console.log(ots.map(ot => ({
    id: ot.id,
    employeeId: ot.employeeId,
    requestDate: ot.requestDate,
    status: ot.status
  })));

  const notifs = await prisma.notifications.findMany({
    where: {
      type: 'OVERTIME_REQUEST'
    }
  });

  console.log('\nOvertime Notifications:');
  console.log(notifs.map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    link: n.link,
    recipient_id: n.recipient_id
  })));
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
