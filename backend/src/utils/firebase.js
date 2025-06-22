const admin = require('firebase-admin');
const logger = require('./logger');

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
  logger.info('Firebase Admin initialized successfully');
} catch (error) {
  logger.error('Firebase Admin initialization error:', error);
}

/**
 * Send push notification to a single device
 * @param {string} token - FCM device token
 * @param {Object} notification - Notification payload
 * @param {Object} data - Data payload
 * @returns {Promise<Object>} FCM response
 */
const sendPushNotification = async (token, notification, data = {}) => {
  try {
    const message = {
      token,
      notification,
      data: Object.keys(data).reduce((acc, key) => {
        acc[key] = String(data[key]); // FCM requires all data values to be strings
        return acc;
      }, {}),
      android: {
        priority: 'high',
        notification: {
          channelId: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default'
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    logger.info(`Push notification sent successfully: ${response}`);
    return response;
  } catch (error) {
    logger.error('Error sending push notification:', error);
    throw error;
  }
};

/**
 * Send push notification to multiple devices
 * @param {string[]} tokens - Array of FCM device tokens
 * @param {Object} notification - Notification payload
 * @param {Object} data - Data payload
 * @returns {Promise<Object>} FCM response
 */
const sendMulticastPushNotification = async (tokens, notification, data = {}) => {
  try {
    const message = {
      tokens,
      notification,
      data: Object.keys(data).reduce((acc, key) => {
        acc[key] = String(data[key]);
        return acc;
      }, {}),
      android: {
        priority: 'high',
        notification: {
          channelId: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default'
          }
        }
      }
    };

    const response = await admin.messaging().sendMulticast(message);
    logger.info(`Multicast push notification sent. Success: ${response.successCount}/${tokens.length}`);
    return response;
  } catch (error) {
    logger.error('Error sending multicast push notification:', error);
    throw error;
  }
};

/**
 * Subscribe tokens to a topic
 * @param {string[]} tokens - Array of FCM device tokens
 * @param {string} topic - Topic name
 * @returns {Promise<Object>} FCM response
 */
const subscribeToTopic = async (tokens, topic) => {
  try {
    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    logger.info(`Subscribed ${tokens.length} tokens to topic ${topic}`);
    return response;
  } catch (error) {
    logger.error(`Error subscribing to topic ${topic}:`, error);
    throw error;
  }
};

module.exports = {
  sendPushNotification,
  sendMulticastPushNotification,
  subscribeToTopic
}; 