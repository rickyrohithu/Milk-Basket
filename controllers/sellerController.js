const { prisma } = require('../config/db');

// POST /api/sellers
const createSeller = async (req, res) => {
  try {
    const { name, email, phone, password, address, pricePerLitre } = req.body;

    const seller = await prisma.seller.create({
      data: { name, email, phone, password, address, pricePerLitre },
    });

    res.status(201).json({ success: true, data: seller });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }
    console.error('createSeller error:', error);
    res.status(500).json({ success: false, message: 'Server error creating seller' });
  }
};

// GET /api/sellers
const getAllSellers = async (req, res) => {
  try {
    const sellers = await prisma.seller.findMany();
    res.status(200).json({ success: true, data: sellers });
  } catch (error) {
    console.error('getAllSellers error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching sellers' });
  }
};

// GET /api/sellers/:id
const getSellerById = async (req, res) => {
  try {
    const seller = await prisma.seller.findUnique({
      where: { id: Number(req.params.id) },
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

// PUT /api/sellers/:id
const updateSeller = async (req, res) => {
  try {
    const seller = await prisma.seller.update({
      where: { id: Number(req.params.id) },
      data: req.body,
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

// DELETE /api/sellers/:id
const deleteSeller = async (req, res) => {
  try {
    await prisma.seller.delete({
      where: { id: Number(req.params.id) },
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

module.exports = { createSeller, getAllSellers, getSellerById, updateSeller, deleteSeller };
