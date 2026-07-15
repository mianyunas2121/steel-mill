const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} = require('../validators/schemas');
const {
  register,
  login,
  logout,
  getProfile,
  changePassword,
  refreshToken,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.post('/refresh-token', authenticate, refreshToken);

module.exports = router;
