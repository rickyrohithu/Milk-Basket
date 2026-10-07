const { prisma } = require('../config/db');

// GET /api/buyers — COLLECTOR only
const getAllBuyers = async (req, res) => {
  if (req.user.role !== 'COLLECTOR') {
    return res.status(403).json({ success: false, message: 'Access denied. Only collectors can list all buyers.' });
  }
  try {
    const buyers = await prisma.buyer.findMany({ omit: { password: true } });
    res.status(200).json({ success: true, data: buyers });
  } catch (error) {
    console.error('getAllBuyers error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching buyers' });
  }
};

// GET /api/buyers/:id — BUYER (own) or COLLECTOR
const getBuyerById = async (req, res) => {
  const { role, id: userId } = req.user;
  const targetId = Number(req.params.id);

  if (role === 'BUYER' && userId !== targetId) {
    return res.status(403).json({ success: false, message: 'Access denied. You can only view your own profile.' });
  }
  if (role === 'SELLER') {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  try {
    const buyer = await prisma.buyer.findUnique({
      where: { id: targetId },
      omit: { password: true },
    });
    if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found' });
    res.status(200).json({ success: true, data: buyer });
  } catch (error) {
    console.error('getBuyerById error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching buyer' });
  }
};

// PUT /api/buyers/:id — BUYER, own profile only
const updateBuyer = async (req, res) => {
  const { role, id: userId } = req.user;
  const targetId = Number(req.params.id);

  if (role !== 'BUYER') {
    return res.status(403).json({ success: false, message: 'Access denied. Only buyers can update a buyer profile.' });
  }
  if (userId !== targetId) {
    return res.status(403).json({ success: false, message: 'Access denied. You can only update your own profile.' });
  }

  try {
    const buyer = await prisma.buyer.update({
      where: { id: targetId },
      data: req.body,
      omit: { password: true },
    });
    res.status(200).json({ success: true, data: buyer });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Buyer not found' });
    }
    console.error('updateBuyer error:', error);
    res.status(500).json({ success: false, message: 'Server error updating buyer' });
  }
};

// DELETE /api/buyers/:id — BUYER, own profile only
const deleteBuyer = async (req, res) => {
  const { role, id: userId } = req.user;
  const targetId = Number(req.params.id);

  if (role !== 'BUYER') {
    return res.status(403).json({ success: false, message: 'Access denied. Only buyers can delete a buyer profile.' });
  }
  if (userId !== targetId) {
    return res.status(403).json({ success: false, message: 'Access denied. You can only delete your own profile.' });
  }

  try {
    await prisma.buyer.delete({ where: { id: targetId } });
    res.status(200).json({ success: true, message: 'Buyer deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Buyer not found' });
    }
    console.error('deleteBuyer error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting buyer' });
  }
};

module.exports = { getAllBuyers, getBuyerById, updateBuyer, deleteBuyer };
