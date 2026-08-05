import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching existing overtime request notifications...');
  
  const notifications = await prisma.notifications.findMany({
    where: {
      type: 'OVERTIME_REQUEST',
      title: 'New Overtime Request',
    }
  });

  console.log(`Found ${notifications.length} notifications to process.`);
  let updatedCount = 0;

  for (const notif of notifications) {
    if (!notif.link) continue;
    
    // Check if it already has the new format
    if (notif.message.includes('Hours:')) continue;

    // Extract ID from link
    console.log('Notif Link:', notif.link);
    const match = notif.link.match(/overtimeRequestId=(\d+)/);
    if (!match) continue;
    
    const requestId = parseInt(match[1], 10);
    
    const overtimeReq = await prisma.overtimeRequest.findUnique({
      where: { id: requestId }
    });
    console.log('overtimeReq:', overtimeReq);
    
    if (overtimeReq) {
      // Remove trailing dot if it exists before appending
      let baseMessage = notif.message.trim();
      if (!baseMessage.endsWith('.')) {
        baseMessage += '.';
      }

      const newMessage = `${baseMessage}\nHours: ${overtimeReq.requestedHours}\nReason: ${overtimeReq.reason}`;
      
      await prisma.notifications.update({
        where: { id: notif.id },
        data: { message: newMessage }
      });
      
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} notifications.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
