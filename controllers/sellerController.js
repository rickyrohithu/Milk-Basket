const { prisma } = require('../config/db');

// GET /api/sellers — BUYER and COLLECTOR (browse available sellers)
const getAllSellers = async (req, res) => {
  const { role } = req.user;
  if (role !== 'BUYER' && role !== 'COLLECTOR') {
    return res.status(403).json({ success: false, message: 'Access denied. Only buyers and collectors can view sellers list.' });
  }

  try {
    const sellers = await prisma.seller.findMany({ omit: { password: true } });
    res.status(200).json({ success: true, data: sellers });
  } catch (error) {
    console.error('getAllSellers error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching sellers' });
  }
};

// GET /api/sellers/:id — BUYER, COLLECTOR, or SELLER (own profile)
const getSellerById = async (req, res) => {
  const { role, id: userId } = req.user;
  const targetId = Number(req.params.id);

  if (role === 'SELLER' && userId !== targetId) {
    return res.status(403).json({ success: false, message: 'Access denied. You can only view your own profile.' });
  }

  try {
    const seller = await prisma.seller.findUnique({
      where: { id: targetId },
      omit: { password: true },
    });

    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    res.status(200).json({ success: true, data: seller });
  } catch (error) {
    console.error('getSellerById error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching seller' });
  }
};

// PUT /api/sellers/:id — SELLER (own profile only)
const updateSeller = async (req, res) => {
  const { role, id: userId } = req.user;
  const targetId = Number(req.params.id);

  if (role !== 'SELLER') {
    return res.status(403).json({ success: false, message: 'Access denied. Only sellers can update a seller profile.' });
  }
  if (userId !== targetId) {
    return res.status(403).json({ success: false, message: 'Access denied. You can only update your own profile.' });
  }

  try {
    const seller = await prisma.seller.update({
      where: { id: targetId },
      data: req.body,
      omit: { password: true },
    });

    res.status(200).json({ success: true, data: seller });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }
    console.error('updateSeller error:', error);
    res.status(500).json({ success: false, message: 'Server error updating seller' });
  }
};

// DELETE /api/sellers/:id — SELLER (own profile only)
const deleteSeller = async (req, res) => {
  const { role, id: userId } = req.user;
  const targetId = Number(req.params.id);

  if (role !== 'SELLER') {
    return res.status(403).json({ success: false, message: 'Access denied. Only sellers can delete a seller profile.' });
  }
  if (userId !== targetId) {
    return res.status(403).json({ success: false, message: 'Access denied. You can only delete your own profile.' });
  }

  try {
    await prisma.seller.delete({
      where: { id: targetId },
    });

    res.status(200).json({ success: true, message: 'Seller deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }
    console.error('deleteSeller error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting seller' });
  }
};

module.exports = { getAllSellers, getSellerById, updateSeller, deleteSeller };
