const express = require('express');
const router = express.Router();
const {
  createSeller,
  getAllSellers,
  getSellerById,
  updateSeller,
  deleteSeller,
} = require('../controllers/sellerController');
const validate = require('../middleware/validate');
const sellerSchema = require('../validators/sellerValidator');

// POST   /api/sellers  — full validation
router.post('/', validate(sellerSchema), createSeller);

// GET    /api/sellers
router.get('/', getAllSellers);

// GET    /api/sellers/:id
router.get('/:id', getSellerById);

// PUT    /api/sellers/:id  — partial validation (all fields optional)
router.put('/:id', validate(sellerSchema, true), updateSeller);

// DELETE /api/sellers/:id
router.delete('/:id', deleteSeller);

module.exports = router;
