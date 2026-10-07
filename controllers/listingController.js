const { prisma } = require('../config/db');

// POST /api/listings — SELLER only
const createListing = async (req, res) => {
  const { role, id: sellerId } = req.user;

  if (role !== 'SELLER') {
    return res.status(403).json({ success: false, message: 'Access denied. Only sellers can create listings.' });
  }

  try {
    const { milkType, pricePerLitre, availableStock, date } = req.body;

    const data = {
      sellerId,
      milkType,
      pricePerLitre: Number(pricePerLitre),
      availableStock: Number(availableStock),
    };

    if (date) {
      data.date = new Date(date);
    }

    const listing = await prisma.milkListing.create({
      data,
      include: {
        seller: {
          select: { id: true, name: true, phone: true, address: true },
        },
      },
    });

    res.status(201).json({ success: true, data: listing });
  } catch (error) {
    console.error('createListing error:', error);
    res.status(500).json({ success: false, message: 'Server error creating listing' });
  }
};

// GET /api/listings — All listings
const getAllListings = async (req, res) => {
  try {
    const listings = await prisma.milkListing.findMany({
      include: {
        seller: {
          select: { id: true, name: true, phone: true, address: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: listings });
  } catch (error) {
    console.error('getAllListings error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching listings' });
  }
};

// GET /api/listings/:id — Single listing by ID
const getListingById = async (req, res) => {
  const targetId = Number(req.params.id);

  try {
    const listing = await prisma.milkListing.findUnique({
      where: { id: targetId },
      include: {
        seller: {
          select: { id: true, name: true, phone: true, address: true },
        },
      },
    });

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    console.error('getListingById error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching listing' });
  }
};

// PUT /api/listings/:id — SELLER only (own listing)
const updateListing = async (req, res) => {
  const { role, id: userId } = req.user;
  const targetId = Number(req.params.id);

  if (role !== 'SELLER') {
    return res.status(403).json({ success: false, message: 'Access denied. Only sellers can update listings.' });
  }

  try {
    const existingListing = await prisma.milkListing.findUnique({
      where: { id: targetId },
    });

    if (!existingListing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (existingListing.sellerId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only update your own listings.' });
    }

    const updateData = { ...req.body };
    if (updateData.pricePerLitre !== undefined) {
      updateData.pricePerLitre = Number(updateData.pricePerLitre);
    }
    if (updateData.availableStock !== undefined) {
      updateData.availableStock = Number(updateData.availableStock);
    }
    if (updateData.date !== undefined) {
      updateData.date = new Date(updateData.date);
    }

    const updatedListing = await prisma.milkListing.update({
      where: { id: targetId },
      data: updateData,
      include: {
        seller: {
          select: { id: true, name: true, phone: true, address: true },
        },
      },
    });

    res.status(200).json({ success: true, data: updatedListing });
  } catch (error) {
    console.error('updateListing error:', error);
    res.status(500).json({ success: false, message: 'Server error updating listing' });
  }
};

// DELETE /api/listings/:id — SELLER only (own listing)
const deleteListing = async (req, res) => {
  const { role, id: userId } = req.user;
  const targetId = Number(req.params.id);

  if (role !== 'SELLER') {
    return res.status(403).json({ success: false, message: 'Access denied. Only sellers can delete listings.' });
  }

  try {
    const existingListing = await prisma.milkListing.findUnique({
      where: { id: targetId },
    });

    if (!existingListing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (existingListing.sellerId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only delete your own listings.' });
    }

    await prisma.milkListing.delete({
      where: { id: targetId },
    });

    res.status(200).json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('deleteListing error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting listing' });
  }
};

module.exports = {
  createListing,
  getAllListings,
  getListingById,
  updateListing,
  deleteListing,
};
