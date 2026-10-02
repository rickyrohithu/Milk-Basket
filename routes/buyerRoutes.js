const express = require('express');
const router = express.Router();
const {
  createBuyer,
  getAllBuyers,
  getBuyerById,
  updateBuyer,
  deleteBuyer,
} = require('../controllers/buyerController');
const validate = require('../middleware/validate');
const buyerSchema = require('../validators/buyerValidator');

// POST   /api/buyers  — full validation
router.post('/', validate(buyerSchema), createBuyer);

// GET    /api/buyers
router.get('/', getAllBuyers);

// GET    /api/buyers/:id
router.get('/:id', getBuyerById);

// PUT    /api/buyers/:id  — partial validation (all fields optional)
router.put('/:id', validate(buyerSchema, true), updateBuyer);

// DELETE /api/buyers/:id
router.delete('/:id', deleteBuyer);

module.exports = router;
