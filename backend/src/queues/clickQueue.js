const { Queue } = require('bullmq');
const { REDIS_URL } = require('../config/env');
const IORedis = require('ioredis');

const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on('error', (err) => {
  console.error('[BullMQ Queue] Redis Connection Error:', err.message);
});

const clickQueue = new Queue('click-events', {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 500,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

/**
 * Push click analytics payload to BullMQ queue asynchronously
 * @param {Object} payload
 */
function enqueueClickEvent(payload) {
  clickQueue.add('track-click', payload).catch((err) => {
    console.error('[BullMQ] Failed to enqueue click payload:', err.message);
  });
}

module.exports = {
  clickQueue,
  enqueueClickEvent,
};
