import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration from environment variables
const LOG_BUFFER_SIZE = parseInt(process.env.LOG_BUFFER_SIZE || '100');
const LOG_BUFFER_FLUSH_INTERVAL_MS = parseInt(process.env.LOG_BUFFER_FLUSH_INTERVAL_MS || '5000');
const LOG_BUFFER_MAX_MEMORY_MB = parseInt(process.env.LOG_BUFFER_MAX_MEMORY_MB || '100');

interface LogBuffer {
  logs: any[];
  size: number;
  lastFlush: Date;
}

class LogBufferService {
  private buffer: LogBuffer = {
    logs: [],
    size: 0,
    lastFlush: new Date(),
  };

  private flushInterval: NodeJS.Timeout | null = null;
  private isFlushing = false;

  constructor() {
    this.startFlushInterval();
    this.setupGracefulShutdown();
  }

  /**
   * Add a log entry to the buffer
   */
  async addLog(logEntry: any): Promise<void> {
    // Check memory pressure
    if (this.isMemoryPressureHigh()) {
      console.warn('Memory pressure high, forcing buffer flush');
      await this.flush();
    }

    this.buffer.logs.push(logEntry);
    this.buffer.size++;

    // Flush if buffer size limit reached
    if (this.buffer.size >= LOG_BUFFER_SIZE) {
      await this.flush();
    }
  }

  /**
   * Flush buffer to database
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.buffer.logs.length === 0) {
      return;
    }

    this.isFlushing = true;

    try {
      const logsToFlush = [...this.buffer.logs];
      this.buffer.logs = [];
      this.buffer.size = 0;
      this.buffer.lastFlush = new Date();

      // Batch insert logs
      await prisma.activityLog.createMany({
        data: logsToFlush,
        skipDuplicates: true,
      });

      console.log(`Flushed ${logsToFlush.length} logs to database`);
    } catch (error) {
      console.error('Error flushing logs to database:', error);
      
      // Retry logic - put logs back in buffer
      this.buffer.logs = [...this.buffer.logs, ...this.buffer.logs];
      this.buffer.size = this.buffer.logs.length;

      // If retry fails after multiple attempts, logs may be lost
      // In production, you might want to write to a fallback file
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Start automatic flush interval
   */
  private startFlushInterval(): void {
    this.flushInterval = setInterval(async () => {
      await this.flush();
    }, LOG_BUFFER_FLUSH_INTERVAL_MS);
  }

  /**
   * Check if memory pressure is high
   */
  private isMemoryPressureHigh(): boolean {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    const maxMemory = LOG_BUFFER_MAX_MEMORY_MB;
    return used > maxMemory * 0.8; // 80% threshold
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}, flushing log buffer...`);
      clearInterval(this.flushInterval!);
      await this.flush();
      console.log('Log buffer flushed successfully');
      process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  /**
   * Get buffer statistics
   */
  getStats(): { size: number; lastFlush: Date; isFlushing: boolean } {
    return {
      size: this.buffer.size,
      lastFlush: this.buffer.lastFlush,
      isFlushing: this.isFlushing,
    };
  }

  /**
   * Manually trigger flush (for testing or admin use)
   */
  async manualFlush(): Promise<void> {
    return this.flush();
  }
}

// Singleton instance
export const logBufferService = new LogBufferService();
