const { prisma } = require('../config/db');
const { createNotification } = require('../utils/notify');

// POST /api/orders — BUYER only (atomic stock check & deduction + auto-assign collector)
const createOrder = async (req, res) => {
  const { listingId, quantity } = req.body;

  try {
    let sellerId = null;

    // Step 1: stock check + deduct + create order, all atomic
    let order = await prisma.$transaction(async (tx) => {
      const listing = await tx.milkListing.findUnique({ where: { id: listingId } });

      if (!listing) throw new Error('Listing not found');
      if (listing.availableStock < quantity) throw new Error('Not enough stock available');

      sellerId = listing.sellerId;

      await tx.milkListing.update({
        where: { id: listingId },
        data: { availableStock: listing.availableStock - quantity },
      });

      return tx.order.create({
        data: {
          buyerId: req.user.id,
          listingId,
          quantity,
        },
      });
    });

    // Notify Seller that a new order has been placed
    if (sellerId) {
      createNotification({
        recipientRole: 'SELLER',
        recipientId: sellerId,
        message: `New order #${order.id} received for ${quantity}L milk.`,
        type: 'ORDER_PLACED',
      }).catch((err) => console.error('Notification error (ORDER_PLACED):', err));
    }

    // Step 2: fetch the buyer's address (needed for region matching)
    const buyer = await prisma.buyer.findUnique({ where: { id: req.user.id } });

    // Step 3: try to auto-assign a collector in the buyer's region
    const collector = await prisma.collector.findFirst({
      where: { region: { contains: buyer.address, mode: 'insensitive' } },
    });

    if (collector) {
      order = await prisma.order.update({
        where: { id: order.id },
        data: { collectorId: collector.id, status: 'ASSIGNED' },
        include: {
          collector: { select: { id: true, name: true, phone: true, region: true } },
          listing: true,
        },
      });

      // Notify collector & buyer about assignment
      Promise.allSettled([
        createNotification({
          recipientRole: 'COLLECTOR',
          recipientId: collector.id,
          message: `You have been assigned to pick up Order #${order.id} (${quantity}L).`,
          type: 'ORDER_ASSIGNED',
        }),
        createNotification({
          recipientRole: 'BUYER',
          recipientId: req.user.id,
          message: `Collector ${collector.name} has been assigned to your order #${order.id}.`,
          type: 'ORDER_ASSIGNED',
        }),
      ]).catch((err) => console.error('Notification error (ORDER_ASSIGNED):', err));
    }
    // if no collector found, order just stays PENDING — that's fine, no error thrown

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Allowed transitions map per role
const VALID_TRANSITIONS = {
  BUYER: {
    PENDING: ['CANCELLED'],
    ASSIGNED: ['CANCELLED'],
  },
  SELLER: {
    PENDING: ['CANCELLED'],
    ASSIGNED: ['CANCELLED'],
  },
  COLLECTOR: {
    PENDING: ['ASSIGNED', 'CANCELLED'],
    ASSIGNED: ['PICKED_UP', 'CANCELLED'],
    PICKED_UP: ['IN_TRANSIT', 'DELIVERED', 'CANCELLED'],
    IN_TRANSIT: ['DELIVERED', 'CANCELLED'],
  },
};

// GET /api/orders — Authenticated (role-based order retrieval)
const getAllOrders = async (req, res) => {
  const { role, id: userId } = req.user;

  try {
    let where = {};
    if (role === 'BUYER') {
      where = { buyerId: userId };
    } else if (role === 'SELLER') {
      where = { listing: { sellerId: userId } };
    } else if (role === 'COLLECTOR') {
      where = {
        OR: [
          { collectorId: userId },
          { collectorId: null, status: 'PENDING' },
        ],
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        listing: {
          include: {
            seller: {
              select: { id: true, name: true, phone: true, address: true, email: true },
            },
          },
        },
        buyer: {
          select: { id: true, name: true, phone: true, address: true, email: true },
        },
        collector: {
          select: { id: true, name: true, phone: true, region: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('getAllOrders error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching orders' });
  }
};

// GET /api/orders/:id — Authenticated (buyer, seller of listing, or assigned/available collector)
const getOrderById = async (req, res) => {
  const { role, id: userId } = req.user;
  const targetId = Number(req.params.id);

  try {
    const order = await prisma.order.findUnique({
      where: { id: targetId },
      include: {
        listing: {
          include: {
            seller: {
              select: { id: true, name: true, phone: true, address: true, email: true },
            },
          },
        },
        buyer: {
          select: { id: true, name: true, phone: true, address: true, email: true },
        },
        collector: {
          select: { id: true, name: true, phone: true, region: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (role === 'BUYER' && order.buyerId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view your own orders.' });
    }

    if (role === 'SELLER' && order.listing.sellerId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only view orders for your listings.' });
    }

    if (role === 'COLLECTOR' && order.collectorId !== null && order.collectorId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied. This order is assigned to another collector.' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('getOrderById error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching order' });
  }
};

// PUT /api/orders/:id/status — Authenticated (role-enforced status transition)
const updateOrderStatus = async (req, res) => {
  const { role, id: userId } = req.user;
  const targetId = Number(req.params.id);
  const { status } = req.body;

  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id: targetId },
      include: {
        listing: true,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Role-based ownership verification
    if (role === 'BUYER') {
      if (existingOrder.buyerId !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only update your own orders.' });
      }
    } else if (role === 'SELLER') {
      if (existingOrder.listing.sellerId !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied. You can only update orders for your listings.' });
      }
    } else if (role === 'COLLECTOR') {
      if (existingOrder.collectorId && existingOrder.collectorId !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied. This order is assigned to another collector.' });
      }
      if (!existingOrder.collectorId && status !== 'ASSIGNED') {
        return res.status(400).json({ success: false, message: 'You must claim/assign this order to yourself before updating its status.' });
      }
    } else {
      return res.status(403).json({ success: false, message: 'Access denied. Invalid user role.' });
    }

    // State machine check
    const allowedStatuses = VALID_TRANSITIONS[role]?.[existingOrder.status] || [];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition: Role '${role}' cannot move order from '${existingOrder.status}' to '${status}'. Allowed next status(es): ${allowedStatuses.length > 0 ? allowedStatuses.join(', ') : 'none (terminal state)'}.`,
      });
    }

    // Prepare update data
    const updateData = { status };
    if (role === 'COLLECTOR' && !existingOrder.collectorId && status === 'ASSIGNED') {
      updateData.collectorId = userId;
    }

    // Handle cancellation: restore available stock to listing if cancelled before pickup
    const shouldRestoreStock = status === 'CANCELLED' && ['PENDING', 'ASSIGNED'].includes(existingOrder.status);

    const updatedOrder = await prisma.$transaction(async (tx) => {
      if (shouldRestoreStock) {
        await tx.milkListing.update({
          where: { id: existingOrder.listingId },
          data: {
            availableStock: {
              increment: existingOrder.quantity,
            },
          },
        });
      }

      return tx.order.update({
        where: { id: targetId },
        data: updateData,
        include: {
          listing: {
            include: {
              seller: {
                select: { id: true, name: true, phone: true, address: true, email: true },
              },
            },
          },
          buyer: {
            select: { id: true, name: true, phone: true, address: true, email: true },
          },
          collector: {
            select: { id: true, name: true, phone: true, region: true },
          },
        },
      });
    });

    // Create notifications based on new status
    try {
      const sellerId = updatedOrder.listing?.sellerId || existingOrder.listing?.sellerId;
      const buyerId = updatedOrder.buyerId;
      const collectorId = updatedOrder.collectorId;
      const collectorName = updatedOrder.collector?.name || 'Collector';
      const notificationPromises = [];

      if (status === 'ASSIGNED') {
        notificationPromises.push(
          createNotification({
            recipientRole: 'BUYER',
            recipientId: buyerId,
            message: `Your order #${targetId} has been assigned to ${collectorName}.`,
            type: 'ORDER_ASSIGNED',
          })
        );
        if (collectorId && role !== 'COLLECTOR') {
          notificationPromises.push(
            createNotification({
              recipientRole: 'COLLECTOR',
              recipientId: collectorId,
              message: `Order #${targetId} has been assigned to you.`,
              type: 'ORDER_ASSIGNED',
            })
          );
        }
      } else if (status === 'PICKED_UP') {
        notificationPromises.push(
          createNotification({
            recipientRole: 'BUYER',
            recipientId: buyerId,
            message: `Your order #${targetId} has been picked up by ${collectorName}.`,
            type: 'ORDER_PICKED_UP',
          }),
          createNotification({
            recipientRole: 'SELLER',
            recipientId: sellerId,
            message: `Order #${targetId} (${updatedOrder.quantity}L) has been picked up from your location.`,
            type: 'ORDER_PICKED_UP',
          })
        );
      } else if (status === 'IN_TRANSIT') {
        notificationPromises.push(
          createNotification({
            recipientRole: 'BUYER',
            recipientId: buyerId,
            message: `Your order #${targetId} is now in transit for delivery.`,
            type: 'ORDER_IN_TRANSIT',
          })
        );
      } else if (status === 'DELIVERED') {
        notificationPromises.push(
          createNotification({
            recipientRole: 'BUYER',
            recipientId: buyerId,
            message: `Your order #${targetId} has been successfully delivered!`,
            type: 'ORDER_DELIVERED',
          }),
          createNotification({
            recipientRole: 'SELLER',
            recipientId: sellerId,
            message: `Order #${targetId} (${updatedOrder.quantity}L) has been delivered to the buyer.`,
            type: 'ORDER_DELIVERED',
          })
        );
      } else if (status === 'CANCELLED') {
        if (role !== 'BUYER' && buyerId) {
          notificationPromises.push(
            createNotification({
              recipientRole: 'BUYER',
              recipientId: buyerId,
              message: `Order #${targetId} was cancelled by the ${role.toLowerCase()}.`,
              type: 'ORDER_CANCELLED',
            })
          );
        }
        if (role !== 'SELLER' && sellerId) {
          notificationPromises.push(
            createNotification({
              recipientRole: 'SELLER',
              recipientId: sellerId,
              message: `Order #${targetId} was cancelled by the ${role.toLowerCase()}.`,
              type: 'ORDER_CANCELLED',
            })
          );
        }
        if (role !== 'COLLECTOR' && collectorId) {
          notificationPromises.push(
            createNotification({
              recipientRole: 'COLLECTOR',
              recipientId: collectorId,
              message: `Order #${targetId} was cancelled by the ${role.toLowerCase()}.`,
              type: 'ORDER_CANCELLED',
            })
          );
        }
      }

      await Promise.allSettled(notificationPromises);
    } catch (notifErr) {
      console.error('Notification dispatch error:', notifErr);
    }

    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error updating order status' });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};

