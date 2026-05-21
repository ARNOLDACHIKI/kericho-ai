const logger = require("../src/lib/logger");

const queue = [];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5 * 1000;

let isProcessing = false;

function createJob(job = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: job.type,
    payload: job.payload || {},
    retries: Number.isInteger(job.retries) ? job.retries : 0,
    status: job.status || "pending",
    nextAttemptAt: job.nextAttemptAt || Date.now(),
    handler: typeof job.handler === "function" ? job.handler : null,
    createdAt: job.createdAt || Date.now(),
    lastError: job.lastError || null,
  };
}

function addToQueue(job) {
  if (!job || !job.type) {
    throw new Error("Queue job requires a type");
  }

  const queuedJob = createJob(job);
  queue.push(queuedJob);
  logger.info({ jobId: queuedJob.id, type: queuedJob.type, retries: queuedJob.retries }, "Job added to queue");
  return queuedJob;
}

async function retryJob(job) {
  if (!job) {
    return null;
  }

  if (job.retries >= MAX_RETRIES) {
    job.status = "failed";
    logger.error({ jobId: job.id, type: job.type, retries: job.retries, error: job.lastError }, "Queue job failed after max retries");
    return job;
  }

  job.retries += 1;
  job.status = "pending";
  job.nextAttemptAt = Date.now() + RETRY_DELAY_MS;
  logger.warn({ jobId: job.id, type: job.type, retries: job.retries }, "Retry scheduled for queued job");
  return job;
}

async function processQueue() {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
    const now = Date.now();
    const jobsToProcess = queue.filter(
      (job) => job.status === "pending" && job.nextAttemptAt <= now
    );

    for (const job of jobsToProcess) {
      job.status = "processing";

      try {
        if (!job.handler) {
          throw new Error("Queued job is missing a handler");
        }

        await job.handler(job);
        job.status = "completed";
        logger.info({ jobId: job.id, type: job.type }, "Queued job completed");
      } catch (error) {
        job.lastError = error?.message || String(error);
        await retryJob(job);
      }
    }

    // Keep failed jobs for visibility, but remove completed jobs to avoid unbounded growth.
    for (let index = queue.length - 1; index >= 0; index -= 1) {
      if (queue[index].status === "completed") {
        queue.splice(index, 1);
      }
    }
  } finally {
    isProcessing = false;
  }
}

function getQueueSnapshot() {
  return queue.map((job) => ({
    id: job.id,
    type: job.type,
    status: job.status,
    retries: job.retries,
    nextAttemptAt: job.nextAttemptAt,
    createdAt: job.createdAt,
    lastError: job.lastError,
  }));
}

module.exports = {
  addToQueue,
  processQueue,
  retryJob,
  getQueueSnapshot,
};
