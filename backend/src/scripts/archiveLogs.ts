/**
 * Archive existing activity_logs data
 * Run this script before implementing the new logging system
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function archiveLogs() {
  console.log('Starting log archival process...');

  try {
    // Check if there are existing logs
    const logCount = await prisma.activityLog.count();
    console.log(`Found ${logCount} existing logs`);

    if (logCount === 0) {
      console.log('No logs to archive. Exiting.');
      return;
    }

    // Fetch all existing logs
    const logs = await prisma.activityLog.findMany({
      orderBy: { timestamp: 'asc' },
    });

    console.log(`Fetched ${logs.length} logs for archival`);

    // Create archive directory if it doesn't exist
    const archiveDir = path.join(process.cwd(), 'archives');
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    // Generate archive filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveFile = path.join(archiveDir, `activity_logs_archive_${timestamp}.json`);

    // Write logs to archive file
    fs.writeFileSync(archiveFile, JSON.stringify(logs, null, 2), 'utf8');
    console.log(`Archived logs to: ${archiveFile}`);

    // Optionally: Delete logs from database after successful archival
    // Uncomment the lines below to delete logs after archival
    /*
    console.log('Deleting archived logs from database...');
    await prisma.activityLog.deleteMany({});
    console.log('All logs deleted from database');
    */

    console.log('Archival process completed successfully');
  } catch (error) {
    console.error('Error during archival process:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the archival
archiveLogs()
  .then(() => {
    console.log('Archive script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Archive script failed:', error);
    process.exit(1);
  });
