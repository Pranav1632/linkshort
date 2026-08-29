const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { REDIS_URL } = require('./config/env');
const { processClickJob } = require('./processors/clickProcessor');

console.log('[Worker] Starting LinkShort Analytics Background Worker...');

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on('connect', () => {
  console.log('[Worker] Connected to Redis queue store successfully');
});

connection.on('error', (err) => {
  console.error('[Worker] Redis Connection Error:', err.message);
});

// Initialize BullMQ Worker listening on 'click-events' queue
const clickWorker = new Worker(
  'click-events',
  async (job) => {
    console.log(`[Worker] Processing click job #${job.id} for shortCode "${job.data.shortCode}"...`);
    const result = await processClickJob(job.data);
    console.log(`[Worker] Click job #${job.id} processed successfully. Inserted Click ID: ${result.id}`);
    return result;
  },
  {
    connection,
    concurrency: 10, // Process up to 10 analytics jobs concurrently
  }
);

clickWorker.on('completed', (job) => {
  console.log(`[Worker] Job #${job.id} completed.`);
});

clickWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job #${job.id} failed:`, err.message);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] SIGTERM received. Closing BullMQ worker...');
  await clickWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Worker] SIGINT received. Closing BullMQ worker...');
  await clickWorker.close();
  process.exit(0);
});
