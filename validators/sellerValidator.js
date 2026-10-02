const { z } = require('zod');

const sellerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  pricePerLitre: z.number({ invalid_type_error: 'pricePerLitre must be a number' }).positive('pricePerLitre must be positive'),
});

module.exports = sellerSchema;
