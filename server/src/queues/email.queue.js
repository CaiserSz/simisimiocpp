const { Queue, Worker, QueueScheduler } = require('bullmq');
const Redis = require('ioredis');
const { createLogger } = require('../utils/logger');
const config = require('../config/config');
const emailService = require('../services/email.service');

const logger = createLogger('email-queue');

// Create Redis connection
const connection = new Redis(config.redis.uri, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...config.redis.options,
});

// Queue name
const QUEUE_NAME = 'emails';

/**
 * Email Queue Class
 * Manages email sending jobs with retry and concurrency control
 */
class EmailQueue {
  constructor() {
    this.queue = null;
    this.worker = null;
    this.scheduler = null;
    this.initialized = false;
  }

  /**
   * Initialize the email queue and worker
   */
  async init() {
    if (this.initialized) return;

    try {
      // Create queue
      this.queue = new Queue(QUEUE_NAME, { 
        connection,
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: 100, // Keep last 100 failed jobs
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000, // 1s, 2s, 4s, etc.
          },
        },
      });

      // Create queue scheduler for delayed jobs
      this.scheduler = new QueueScheduler(QUEUE_NAME, { connection });

      // Create worker to process jobs
      this.worker = new Worker(
        QUEUE_NAME,
        async (job) => {
          const { type, data } = job.data;
          
          try {
            logger.debug(`Processing email job: ${job.id} (${type})`, { 
              jobId: job.id,
              type,
              attempt: job.attemptsMade + 1,
            });

            let result;
            
            // Handle different email types
            switch (type) {
              case 'password-reset':
                result = await emailService.sendPasswordResetEmail(
                  data.to,
                  data.name,
                  data.resetLink,
                  data.expiresIn
                );
                break;
                
              case 'verification':
                result = await emailService.sendVerificationEmail(
                  data.to,
                  data.name,
                  data.verificationLink,
                  data.expiresIn
                );
                break;
                
              case 'custom':
                result = await emailService.sendEmail({
                  to: data.to,
                  subject: data.subject,
                  text: data.text,
                  html: data.html,
                  template: data.template,
                  context: data.context,
                  attachments: data.attachments,
                });
                break;
                
              default:
                throw new Error(`Unsupported email type: ${type}`);
            }
            
            logger.info(`Email sent successfully: ${job.id}`, { 
              jobId: job.id,
              type,
              result,
            });
            
            return result;
            
          } catch (error) {
            logger.error(`Failed to send email (${job.id}):`, {
              error: error.message,
              stack: error.stack,
              job: job.data,
              attempt: job.attemptsMade + 1,
            });
            
            // Rethrow to trigger retry
            throw error;
          }
        },
        { 
          connection,
          concurrency: config.email.concurrency || 5,
          limiter: {
            max: 100, // Max jobs per interval
            duration: 1000, // Per second
          },
        }
      );

      // Worker events
      this.worker.on('completed', (job, result) => {
        logger.debug(`Job ${job.id} completed`, { result });
      });

      this.worker.on('failed', (job, error) => {
        logger.error(`Job ${job.id} failed after ${job.attemptsMade} attempts`, {
          error: error.message,
          stack: error.stack,
          job: job.data,
          attempts: job.attemptsMade,
        });
      });

      this.initialized = true;
      logger.info('Email queue initialized');
      
    } catch (error) {
      logger.error('Failed to initialize email queue:', error);
      throw error;
    }
  }

  /**
   * Add an email job to the queue
   * @param {Object} jobData - Job data
   * @param {string} jobData.type - Email type (password-reset, verification, custom)
   * @param {Object} jobData.data - Email data
   * @param {Object} [options] - Job options
   * @returns {Promise<Job>} The created job
   */
  async addEmailJob(jobData, options = {}) {
    if (!this.initialized) {
      await this.init();
    }

    const job = await this.queue.add(
      jobData.type,
      jobData,
      {
        jobId: `${jobData.type}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`,
        ...options,
      }
    );

    logger.debug(`Added email job to queue: ${job.id}`, { 
      jobId: job.id,
      type: jobData.type,
    });

    return job;
  }

  /**
   * Add a password reset email job
   * @param {Object} data - Email data
   * @param {string} data.to - Recipient email
   * @param {string} data.name - Recipient name
   * @param {string} data.resetLink - Password reset link
   * @param {string} [data.expiresIn='1 hour'] - Expiration time
   * @param {Object} [options] - Job options
   * @returns {Promise<Job>} The created job
   */
  async addPasswordResetEmail(data, options = {}) {
    return this.addEmailJob(
      {
        type: 'password-reset',
        data: {
          to: data.to,
          name: data.name,
          resetLink: data.resetLink,
          expiresIn: data.expiresIn || '1 hour',
        },
      },
      {
        priority: 1, // Higher priority for password resets
        ...options,
      }
    );
  }

  /**
   * Add an email verification job
   * @param {Object} data - Email data
   * @param {string} data.to - Recipient email
   * @param {string} data.name - Recipient name
   * @param {string} data.verificationLink - Verification link
   * @param {string} [data.expiresIn='24 hours'] - Expiration time
   * @param {Object} [options] - Job options
   * @returns {Promise<Job>} The created job
   */
  async addVerificationEmail(data, options = {}) {
    return this.addEmailJob(
      {
        type: 'verification',
        data: {
          to: data.to,
          name: data.name,
          verificationLink: data.verificationLink,
          expiresIn: data.expiresIn || '24 hours',
        },
      },
      options
    );
  }

  /**
   * Add a custom email job
   * @param {Object} data - Email data
   * @param {string} data.to - Recipient email
   * @param {string} [data.subject] - Email subject
   * @param {string} [data.text] - Plain text content
   * @param {string} [data.html] - HTML content
   * @param {string} [data.template] - Template name
   * @param {Object} [data.context] - Template context
   * @param {Array} [data.attachments] - Email attachments
   * @param {Object} [options] - Job options
   * @returns {Promise<Job>} The created job
   */
  async addCustomEmail(data, options = {}) {
    return this.addEmailJob(
      {
        type: 'custom',
        data: {
          to: data.to,
          subject: data.subject,
          text: data.text,
          html: data.html,
          template: data.template,
          context: data.context,
          attachments: data.attachments,
        },
      },
      options
    );
  }

  /**
   * Get queue metrics
   * @returns {Promise<Object>} Queue metrics
   */
  async getMetrics() {
    if (!this.initialized) {
      await this.init();
    }

    const [
      waiting,
      active,
      completed,
      failed,
      delayed,
    ] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Close the queue and worker
   */
  async close() {
    const promises = [];
    
    if (this.worker) {
      promises.push(this.worker.close());
    }
    
    if (this.scheduler) {
      promises.push(this.scheduler.close());
    }
    
    if (this.queue) {
      promises.push(this.queue.close());
    }
    
    await Promise.all(promises);
    this.initialized = false;
    
    if (connection) {
      await connection.quit();
    }
    
    logger.info('Email queue closed');
  }
}

// Create a singleton instance
const emailQueue = new EmailQueue();

// Handle process exit
const shutdown = async () => {
  try {
    await emailQueue.close();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = emailQueue;
