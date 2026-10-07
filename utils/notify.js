const { prisma } = require('../config/db');

/**
 * Creates a notification record for a specific recipient role and ID.
 *
 * @param {Object} params
 * @param {string} params.recipientRole - The role of the recipient ('BUYER', 'SELLER', 'COLLECTOR')
 * @param {number} params.recipientId - The ID of the recipient
 * @param {string} params.message - The notification message text
 * @param {string} params.type - The notification type (e.g. 'ORDER_PLACED', 'ORDER_ASSIGNED', 'ORDER_DELIVERED')
 * @returns {Promise<Object>} Created notification object
 */
const createNotification = async ({ recipientRole, recipientId, message, type }) => {
  return await prisma.notification.create({
    data: {
      recipientRole,
      recipientId: Number(recipientId),
      message,
      type,
    },
  });
};

module.exports = { createNotification };
