const express = require('express');
const router  = express.Router();
const {
  getAllSellers,
  getSellerById,
  updateSeller,
  deleteSeller,
} = require('../controllers/sellerController');
const validate         = require('../middleware/validate');
const sellerSchema     = require('../validators/sellerValidator');
const { authenticate } = require('../middleware/auth');

// GET    /api/sellers
router.get('/',    authenticate, getAllSellers);

// GET    /api/sellers/:id
router.get('/:id', authenticate, getSellerById);

// PUT    /api/sellers/:id
router.put('/:id', authenticate, validate(sellerSchema, true), updateSeller);

// DELETE /api/sellers/:id
router.delete('/:id', authenticate, deleteSeller);

module.exports = router;
