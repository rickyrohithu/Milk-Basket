const { z } = require('zod');

const listingSchema = z.object({
  milkType: z.string().min(1, 'Milk type is required'),
  pricePerLitre: z.number({ invalid_type_error: 'pricePerLitre must be a number' }).positive('pricePerLitre must be positive'),
  availableStock: z.number({ invalid_type_error: 'availableStock must be a number' }).min(0, 'availableStock cannot be negative'),
  date: z.string().datetime({ offset: true }).or(z.string()).optional(),
});

module.exports = listingSchema;
