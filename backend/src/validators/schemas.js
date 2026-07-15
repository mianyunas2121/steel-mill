const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('ADMIN', 'STAFF', 'ACCOUNTANT', 'VIEWER').default('STAFF'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

const customerSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  contactNumber: Joi.string().allow('', null),
  email: Joi.string().email().allow('', null),
  address: Joi.string().allow('', null),
  gstNumber: Joi.string().allow('', null),
  taxId: Joi.string().allow('', null),
});

const incomingSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  materialType: Joi.string().required(),
  weight: Joi.number().positive().required(),
  pricePerKG: Joi.number().positive().required(),
  notes: Joi.string().allow('', null),
  invoiceDate: Joi.date().optional(),
});

const outgoingSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  materialType: Joi.string().required(),
  weight: Joi.number().positive().required(),
  pricePerKG: Joi.number().positive().required(),
  wasteWeight: Joi.number().min(0).default(0),
  takeWaste: Joi.boolean().default(false),
  notes: Joi.string().allow('', null),
  invoiceDate: Joi.date().optional(),
});

const pricingSchema = Joi.object({
  materialType: Joi.string().required(),
  pricePerKG: Joi.number().positive().required(),
  validFrom: Joi.date().optional(),
  validTo: Joi.date().allow(null).optional(),
});

const paymentSchema = Joi.object({
  customerId: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  paymentMethod: Joi.string().valid('CASH', 'BANK_TRANSFER', 'CHEQUE').default('CASH'),
  invoiceId: Joi.string().uuid().allow(null).optional(),
  paymentDate: Joi.date().optional(),
  notes: Joi.string().allow('', null),
});

const userUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email(),
  role: Joi.string().valid('ADMIN', 'STAFF', 'ACCOUNTANT', 'VIEWER'),
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
  password: Joi.string().min(6).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  customerSchema,
  incomingSchema,
  outgoingSchema,
  pricingSchema,
  paymentSchema,
  userUpdateSchema,
};
