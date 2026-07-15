const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { success, error } = require('../utils/response');

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, users);
  } catch (err) {
    console.error('Get users error:', err);
    return error(res, 'Failed to fetch users');
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return error(res, 'Email already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || 'STAFF' },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });

    return success(res, user, 'User created successfully', 201);
  } catch (err) {
    console.error('Create user error:', err);
    return error(res, 'Failed to create user');
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'User not found', 404);
    }

    if (email && email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        return error(res, 'Email already in use', 400);
      }
    }

    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (role) data.role = role;
    if (status) data.status = status;
    if (password) data.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, status: true, updatedAt: true },
    });

    return success(res, user, 'User updated successfully');
  } catch (err) {
    console.error('Update user error:', err);
    return error(res, 'Failed to update user');
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return error(res, 'Cannot delete your own account', 400);
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return error(res, 'User not found', 404);
    }

    await prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    return success(res, null, 'User deactivated successfully');
  } catch (err) {
    console.error('Delete user error:', err);
    return error(res, 'Failed to delete user');
  }
};

const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return error(res, 'Password must be at least 6 characters', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return success(res, null, 'Password reset successfully');
  } catch (err) {
    console.error('Reset password error:', err);
    return error(res, 'Failed to reset password');
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, resetPassword };
