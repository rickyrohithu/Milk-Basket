const { prisma } = require('../config/db');

// POST /api/collectors
const createCollector = async (req, res) => {
  try {
    const { name, email, phone, password, region } = req.body;

    const collector = await prisma.collector.create({
      data: { name, email, phone, password, region },
    });

    res.status(201).json({ success: true, data: collector });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }
    console.error('createCollector error:', error);
    res.status(500).json({ success: false, message: 'Server error creating collector' });
  }
};

// GET /api/collectors
const getAllCollectors = async (req, res) => {
  try {
    const collectors = await prisma.collector.findMany();
    res.status(200).json({ success: true, data: collectors });
  } catch (error) {
    console.error('getAllCollectors error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching collectors' });
  }
};

// GET /api/collectors/:id
const getCollectorById = async (req, res) => {
  try {
    const collector = await prisma.collector.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!collector) {
      return res.status(404).json({ success: false, message: 'Collector not found' });
    }

    res.status(200).json({ success: true, data: collector });
  } catch (error) {
    console.error('getCollectorById error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching collector' });
  }
};

// PUT /api/collectors/:id
const updateCollector = async (req, res) => {
  try {
    const collector = await prisma.collector.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });

    res.status(200).json({ success: true, data: collector });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Collector not found' });
    }
    console.error('updateCollector error:', error);
    res.status(500).json({ success: false, message: 'Server error updating collector' });
  }
};

// DELETE /api/collectors/:id
const deleteCollector = async (req, res) => {
  try {
    await prisma.collector.delete({
      where: { id: Number(req.params.id) },
    });

    res.status(200).json({ success: true, message: 'Collector deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Collector not found' });
    }
    console.error('deleteCollector error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting collector' });
  }
};

module.exports = { createCollector, getAllCollectors, getCollectorById, updateCollector, deleteCollector };
