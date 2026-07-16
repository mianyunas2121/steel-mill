const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { success, error } = require('../utils/response');

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return error(res, 'Email already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'STAFF',
      },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });

    const token = generateToken(user.id);
    return success(res, { user, token }, 'User registered successfully', 201);
  } catch (err) {
    console.error('Register error:', err);
    return error(res, 'Registration failed');
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return error(res, 'Invalid email or password', 401);
    }

    if (user.status !== 'ACTIVE') {
      return error(res, 'Account is inactive. Contact admin.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return error(res, 'Invalid email or password', 401);
    }

    const token = generateToken(user.id);
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    return success(res, { user: userData, token }, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    const msg =
      process.env.NODE_ENV === 'production' && err.message?.includes('JWT_SECRET')
        ? 'Server misconfigured: JWT_SECRET missing on Railway'
        : err.message?.includes("Can't reach database") || err.code === 'P1001'
          ? 'Database unavailable. Check DATABASE_URL on Railway.'
          : 'Login failed';
    return error(res, msg);
  }
};

const logout = async (req, res) => {
  return success(res, null, 'Logged out successfully');
};

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });
    return success(res, user);
  } catch (err) {
    console.error('Get profile error:', err);
    return error(res, 'Failed to get profile');
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return error(res, 'Current password is incorrect', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    return success(res, null, 'Password changed successfully');
  } catch (err) {
    console.error('Change password error:', err);
    return error(res, 'Failed to change password');
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = generateToken(req.user.id);
    return success(res, { token }, 'Token refreshed');
  } catch (err) {
    return error(res, 'Failed to refresh token');
  }
};

module.exports = { register, login, logout, getProfile, changePassword, refreshToken };
