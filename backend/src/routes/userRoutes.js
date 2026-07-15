const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { registerSchema, userUpdateSchema } = require('../validators/schemas');
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
} = require('../controllers/userController');

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getUsers);
router.post('/', validate(registerSchema), createUser);
router.put('/:id', validate(userUpdateSchema), updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/reset-password', resetPassword);

module.exports = router;
