const express = require('express');
const router  = express.Router();
const {
  getAllBuyers,
  getBuyerById,
  updateBuyer,
  deleteBuyer,
} = require('../controllers/buyerController');
const validate         = require('../middleware/validate');
const buyerSchema      = require('../validators/buyerValidator');
const { authenticate } = require('../middleware/auth');

// GET    /api/buyers
router.get('/',    authenticate, getAllBuyers);

// GET    /api/buyers/:id
router.get('/:id', authenticate, getBuyerById);

// PUT    /api/buyers/:id
router.put('/:id', authenticate, validate(buyerSchema, true), updateBuyer);

// DELETE /api/buyers/:id
router.delete('/:id', authenticate, deleteBuyer);

module.exports = router;
