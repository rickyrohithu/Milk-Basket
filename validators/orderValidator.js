const { z } = require('zod');

const ORDER_STATUSES = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];

const createOrderSchema = z.object({
  listingId: z.number({ invalid_type_error: 'listingId must be a number' }).int().positive('listingId must be positive'),
  quantity: z.number({ invalid_type_error: 'quantity must be a number' }).positive('quantity must be positive'),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, {
    errorMap: () => ({ message: `Status must be one of: ${ORDER_STATUSES.join(', ')}` }),
  }),
});

module.exports = { createOrderSchema, updateOrderStatusSchema, ORDER_STATUSES };

