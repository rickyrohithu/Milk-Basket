require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

// Connect to PostgreSQL via Prisma
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes         = require('./routes/authRoutes');
const sellerRoutes       = require('./routes/sellerRoutes');
const buyerRoutes        = require('./routes/buyerRoutes');
const collectorRoutes    = require('./routes/collectorRoutes');
const listingRoutes      = require('./routes/listingRoutes');
const orderRoutes        = require('./routes/orderRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api/auth',          authRoutes);
app.use('/api/sellers',       sellerRoutes);
app.use('/api/buyers',        buyerRoutes);
app.use('/api/collectors',    collectorRoutes);
app.use('/api/listings',      listingRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/notifications', notificationRoutes);

// Health Check / Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Milk Basket API is running',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
