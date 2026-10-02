const { z } = require('zod');

const collectorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  region: z.string().min(2, 'Region must be at least 2 characters'),
});

module.exports = collectorSchema;
