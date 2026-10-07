const express  = require('express');
const router   = express.Router();
const { signup, login } = require('../controllers/authController');
const validate = require('../middleware/validate');
const { signupSchema, loginSchema } = require('../validators/authValidator');

// POST /api/auth/signup
router.post('/signup', validate(signupSchema), signup);

// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

module.exports = router;
