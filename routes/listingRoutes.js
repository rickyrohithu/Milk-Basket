const express = require('express');
const router  = express.Router();
const {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing,
} = require('../controllers/listingController');
const validate         = require('../middleware/validate');
const listingSchema    = require('../validators/listingValidator');
const { authenticate, authorize } = require('../middleware/auth');

// POST   /api/listings (seller only)
router.post('/', authenticate, authorize('SELLER'), validate(listingSchema), createListing);

// GET    /api/listings
router.get('/', getAllListings);

// GET    /api/listings/:id
router.get('/:id', getListingById);

// PUT    /api/listings/:id (seller only, own listing)
router.put('/:id', authenticate, authorize('SELLER'), validate(listingSchema, true), updateListing);

// DELETE /api/listings/:id (seller only, own listing)
router.delete('/:id', authenticate, authorize('SELLER'), deleteListing);

module.exports = router;
