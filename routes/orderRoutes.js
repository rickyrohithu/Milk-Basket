const express = require('express');
const router  = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController');
const validate = require('../middleware/validate');
const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require('../validators/orderValidator');
const { authenticate, authorize } = require('../middleware/auth');

// POST   /api/orders (buyer only)
router.post('/', authenticate, authorize('BUYER'), validate(createOrderSchema), createOrder);

// GET    /api/orders (authenticated)
router.get('/', authenticate, getAllOrders);

// GET    /api/orders/:id (authenticated)
router.get('/:id', authenticate, getOrderById);

// PUT    /api/orders/:id/status (authenticated)
router.put('/:id/status', authenticate, validate(updateOrderStatusSchema), updateOrderStatus);

module.exports = router;
