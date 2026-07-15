-- Steel Mill Management System - Database Schema
-- PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'ACCOUNTANT', 'VIEWER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "TransactionType" AS ENUM ('INCOMING', 'OUTGOING');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID');

CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role "Role" NOT NULL DEFAULT 'STAFF',
  status "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Customer" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  "contactNumber" VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  "gstNumber" VARCHAR(50),
  "taxId" VARCHAR(50),
  balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Transaction" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type "TransactionType" NOT NULL,
  "customerId" UUID NOT NULL REFERENCES "Customer"(id),
  "createdByUserId" UUID NOT NULL REFERENCES "User"(id),
  "materialType" VARCHAR(100) NOT NULL,
  weight DECIMAL(15,3) NOT NULL,
  "pricePerKG" DECIMAL(15,2) NOT NULL,
  "materialAmount" DECIMAL(15,2) NOT NULL,
  "wasteWeight" DECIMAL(15,3) NOT NULL DEFAULT 0,
  "wastePrice" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "wasteAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "takeWaste" BOOLEAN NOT NULL DEFAULT false,
  "totalBill" DECIMAL(15,2) NOT NULL,
  notes TEXT,
  "invoiceNumber" VARCHAR(50) UNIQUE NOT NULL,
  "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Pricing" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "materialType" VARCHAR(100) NOT NULL,
  "pricePerKG" DECIMAL(15,2) NOT NULL,
  "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "validTo" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Inventory" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "materialType" VARCHAR(100) UNIQUE NOT NULL,
  "currentStock" DECIMAL(15,3) NOT NULL DEFAULT 0,
  "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Payment" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "customerId" UUID NOT NULL REFERENCES "Customer"(id),
  amount DECIMAL(15,2) NOT NULL,
  "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
  "invoiceId" UUID REFERENCES "Transaction"(id),
  notes TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Settings" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transaction_type ON "Transaction"(type);
CREATE INDEX idx_transaction_customer ON "Transaction"("customerId");
CREATE INDEX idx_transaction_date ON "Transaction"("invoiceDate");
CREATE INDEX idx_transaction_invoice ON "Transaction"("invoiceNumber");
CREATE INDEX idx_pricing_material ON "Pricing"("materialType");
CREATE INDEX idx_payment_customer ON "Payment"("customerId");
CREATE INDEX idx_payment_invoice ON "Payment"("invoiceId");
