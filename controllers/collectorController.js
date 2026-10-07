const { prisma } = require('../config/db');

// GET /api/collectors — BUYER and SELLER (find their collector)
const getAllCollectors = async (req, res) => {
  const { role } = req.user;
  if (role !== 'BUYER' && role !== 'SELLER') {
    return res.status(403).json({ success: false, message: 'Access denied. Only buyers and sellers can view collectors list.' });
  }

  try {
    const collectors = await prisma.collector.findMany({ omit: { password: true } });
    res.status(200).json({ success: true, data: collectors });
  } catch (error) {
    console.error('getAllCollectors error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching collectors' });
  }
};

// GET /api/collectors/:id — BUYER, SELLER, or COLLECTOR (own profile)
const getCollectorById = async (req, res) => {
  const { role, id: userId } = req.user;
  const targetId = Number(req.params.id);

  if (role === 'COLLECTOR' && userId !== targetId) {
    return res.status(403).json({ success: false, message: 'Access denied. You can only view your own profile.' });
  }

  try {
    const collector = await prisma.collector.findUnique({
      where: { id: targetId },
      omit: { password: true },
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

// PUT /api/collectors/:id — COLLECTOR (own profile only)
const updateCollector = async (req, res) => {
  const { role, id: userId } = req.user;
  const targetId = Number(req.params.id);

  if (role !== 'COLLECTOR') {
    return res.status(403).json({ success: false, message: 'Access denied. Only collectors can update a collector profile.' });
  }
  if (userId !== targetId) {
    return res.status(403).json({ success: false, message: 'Access denied. You can only update your own profile.' });
  }

  try {
    const collector = await prisma.collector.update({
      where: { id: targetId },
      data: req.body,
      omit: { password: true },
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

// DELETE /api/collectors/:id — COLLECTOR (own profile only)
const deleteCollector = async (req, res) => {
  const { role, id: userId } = req.user;
  const targetId = Number(req.params.id);

  if (role !== 'COLLECTOR') {
    return res.status(403).json({ success: false, message: 'Access denied. Only collectors can delete a collector profile.' });
  }
  if (userId !== targetId) {
    return res.status(403).json({ success: false, message: 'Access denied. You can only delete your own profile.' });
  }

  try {
    await prisma.collector.delete({
      where: { id: targetId },
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

module.exports = { getAllCollectors, getCollectorById, updateCollector, deleteCollector };
