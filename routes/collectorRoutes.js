const express = require('express');
const router  = express.Router();
const {
  getAllCollectors,
  getCollectorById,
  updateCollector,
  deleteCollector,
} = require('../controllers/collectorController');
const validate         = require('../middleware/validate');
const collectorSchema  = require('../validators/collectorValidator');
const { authenticate } = require('../middleware/auth');

// GET    /api/collectors
router.get('/',    authenticate, getAllCollectors);

// GET    /api/collectors/:id
router.get('/:id', authenticate, getCollectorById);

// PUT    /api/collectors/:id
router.put('/:id', authenticate, validate(collectorSchema, true), updateCollector);

// DELETE /api/collectors/:id
router.delete('/:id', authenticate, deleteCollector);

module.exports = router;
