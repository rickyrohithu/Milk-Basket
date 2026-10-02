const express = require('express');
const router = express.Router();
const {
  createCollector,
  getAllCollectors,
  getCollectorById,
  updateCollector,
  deleteCollector,
} = require('../controllers/collectorController');
const validate = require('../middleware/validate');
const collectorSchema = require('../validators/collectorValidator');

// POST   /api/collectors  — full validation
router.post('/', validate(collectorSchema), createCollector);

// GET    /api/collectors
router.get('/', getAllCollectors);

// GET    /api/collectors/:id
router.get('/:id', getCollectorById);

// PUT    /api/collectors/:id  — partial validation (all fields optional)
router.put('/:id', validate(collectorSchema, true), updateCollector);

// DELETE /api/collectors/:id
router.delete('/:id', deleteCollector);

module.exports = router;
