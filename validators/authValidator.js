const { z } = require('zod');

const ROLES = ['BUYER', 'SELLER', 'COLLECTOR'];

// Signup: all core fields + role
const signupSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email address'),
  phone:    z.string().min(10, 'Phone must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role:     z.enum(ROLES, { error: `Role must be one of: ${ROLES.join(', ')}` }),
  // Optional — required for BUYER / SELLER; optional for COLLECTOR (uses region)
  address:  z.string().min(5, 'Address must be at least 5 characters').optional(),
  region:   z.string().min(2, 'Region must be at least 2 characters').optional(),
});

// Login: email + password + role
const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  role:     z.enum(ROLES, { error: `Role must be one of: ${ROLES.join(', ')}` }),
});

module.exports = { signupSchema, loginSchema };
