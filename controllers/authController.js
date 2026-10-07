const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { prisma } = require('../config/db');

const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

// Map role string → prisma model delegate
const modelFor = (role) => {
  switch (role) {
    case 'BUYER':     return prisma.buyer;
    case 'SELLER':    return prisma.seller;
    case 'COLLECTOR': return prisma.collector;
    default:          return null;
  }
};

// Validate that role-specific required fields are present
const validateRoleFields = (role, body) => {
  if ((role === 'BUYER' || role === 'SELLER') && !body.address) {
    return 'Address is required for Buyer and Seller accounts';
  }
  if (role === 'COLLECTOR' && !body.region) {
    return 'Region is required for Collector accounts';
  }
  if (role === 'SELLER' && body.pricePerLitre === undefined) {
    return 'pricePerLitre is required for Seller accounts';
  }
  return null;
};

// POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { name, email, phone, password, role, address, region } = req.body;

    const fieldError = validateRoleFields(role, req.body);
    if (fieldError) {
      return res.status(400).json({ success: false, message: fieldError });
    }

    const model = modelFor(role);
    const hashedPassword = await bcrypt.hash(password, 12);

    // Build the data object per role
    let data = { name, email, phone, password: hashedPassword };
    if (role === 'BUYER')     data.address = address;
    if (role === 'SELLER')    { data.address = address; data.pricePerLitre = Number(req.body.pricePerLitre); }
    if (role === 'COLLECTOR') data.region = region;

    const user = await model.create({ data });

    // Strip password before responding
    const { password: _, ...safeUser } = user;

    const token = jwt.sign(
      { id: user.id, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.status(201).json({
      success: true,
      message: `${role.charAt(0) + role.slice(1).toLowerCase()} account created`,
      token,
      data: safeUser,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email already in use for this role' });
    }
    console.error('signup error:', error);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const model = modelFor(role);
    const user  = await model.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const { password: _, ...safeUser } = user;

    const token = jwt.sign(
      { id: user.id, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: safeUser,
    });
  } catch (error) {
    console.error('login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

module.exports = { signup, login };
