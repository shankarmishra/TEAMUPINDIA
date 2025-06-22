const { emailQueue, notificationQueue, matchAlertQueue } = require('../utils/queue');
const logger = require('../utils/logger');
const { sendPushNotification } = require('../utils/firebase');
const { sendEmail } = require('../utils/email');

// Process email jobs
emailQueue.process(async (job) => {
  try {
    logger.info(`Processing email job ${job.id}`);
    const { to, subject, text, html } = job.data;
    
    const result = await sendEmail({ to, subject, text, html });
    logger.info(`Email sent successfully to ${to}`);
    return result;
  } catch (error) {
    logger.error(`Email job ${job.id} failed:`, error);
    throw error;
  }
});

// Process notification jobs
notificationQueue.process(async (job) => {
  try {
    logger.info(`Processing notification job ${job.id}`);
    const { token, title, body, data } = job.data;
    
    await sendPushNotification(token, {
      title,
      body
    }, data);
    
    logger.info(`Notification sent successfully to token ${token}`);
    return { success: true };
  } catch (error) {
    logger.error(`Notification job ${job.id} failed:`, error);
    throw error;
  }
});

// Process match alert jobs
matchAlertQueue.process(async (job) => {
  try {
    logger.info(`Processing match alert job ${job.id}`);
    const { matchId, type, recipients } = job.data;
    
    // Send notifications to all recipients
    const notifications = recipients.map(recipient => ({
      token: recipient.fcmToken,
      title: `Match ${type} Alert`,
      body: `Your match #${matchId} has an update!`,
      data: { matchId, type }
    }));

    // Process notifications in batches
    const batchSize = 500;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      await Promise.all(batch.map(notification => 
        notificationQueue.add(notification, {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000
          }
        })
      ));
    }
    
    logger.info(`Match alert queued successfully for ${recipients.length} recipients`);
    return { success: true };
  } catch (error) {
    logger.error(`Match alert job ${job.id} failed:`, error);
    throw error;
  }
});

// Global error handlers for queues
[emailQueue, notificationQueue, matchAlertQueue].forEach(queue => {
  queue.on('error', error => {
    logger.error('Queue error:', error);
  });

  queue.on('failed', (job, error) => {
    logger.error(`Job ${job.id} in queue ${queue.name} failed:`, error);
  });

  queue.on('completed', (job, result) => {
    logger.info(`Job ${job.id} in queue ${queue.name} completed:`, result);
  });
});

logger.info('Queue worker started successfully'); 