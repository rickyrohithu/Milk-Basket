const { prisma } = require('../config/db');

// POST /api/buyers
const createBuyer = async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;

    const buyer = await prisma.buyer.create({
      data: { name, email, phone, password, address },
    });

    res.status(201).json({ success: true, data: buyer });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }
    console.error('createBuyer error:', error);
    res.status(500).json({ success: false, message: 'Server error creating buyer' });
  }
};

// GET /api/buyers
const getAllBuyers = async (req, res) => {
  try {
    const buyers = await prisma.buyer.findMany();
    res.status(200).json({ success: true, data: buyers });
  } catch (error) {
    console.error('getAllBuyers error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching buyers' });
  }
};

// GET /api/buyers/:id
const getBuyerById = async (req, res) => {
  try {
    const buyer = await prisma.buyer.findUnique({
      where: { id: Number(req.params.id) },
    });

    if (!buyer) {
      return res.status(404).json({ success: false, message: 'Buyer not found' });
    }

    res.status(200).json({ success: true, data: buyer });
  } catch (error) {
    console.error('getBuyerById error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching buyer' });
  }
};

// PUT /api/buyers/:id
const updateBuyer = async (req, res) => {
  try {
    const buyer = await prisma.buyer.update({
      where: { id: Number(req.params.id) },
      data: req.body,
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

// DELETE /api/buyers/:id
const deleteBuyer = async (req, res) => {
  try {
    await prisma.buyer.delete({
      where: { id: Number(req.params.id) },
    });

    res.status(200).json({ success: true, message: 'Buyer deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Buyer not found' });
    }
    console.error('deleteBuyer error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting buyer' });
  }
};

module.exports = { createBuyer, getAllBuyers, getBuyerById, updateBuyer, deleteBuyer };
