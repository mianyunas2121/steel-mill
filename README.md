# Steel Mill Management System (SMMS)

End-to-end software for running a steel mill’s day-to-day operations: material in/out, waste billing, inventory, customers, invoices, payments, and reports.

---

## What This Software Does

SMMS helps mill staff track who bought/sold what, how much stock is left, how bills are calculated (including waste), and who still owes money — with all amounts in **Pakistani Rupees (PKR)**.

| Area | Purpose |
|------|---------|
| **Incoming** | Record material received from suppliers; stock goes **up** |
| **Outgoing** | Record material sold to customers; stock goes **down**; bill is calculated |
| **Waste billing** | Decide if customer takes waste (extra charge) or not (discount) |
| **Inventory** | Live stock (KG) per material with low-stock alerts |
| **Customers** | Customer/supplier master list, balances, order history |
| **Billing** | Search invoices, print/PDF, record payments |
| **Reports** | Daily, monthly, customer, and material reports |
| **Admin** | Users, material prices, company settings |

---

## Core Business Logic (Waste)

For **outgoing** sales, the bill depends on waste handling:

1. `materialAmount = weight × pricePerKG`
2. `wasteAmount = wasteWeight × pricePerKG` (same rate)

| Customer choice | Formula | Example (100 KG @ ₹50, 5 KG waste) |
|-----------------|---------|--------------------------------------|
| **Takes waste** | material + waste | 5000 + 250 = **PKR 5,250** |
| **Doesn’t take waste** | material − waste (discount) | 5000 − 250 = **PKR 4,750** |

For **incoming** purchases: `total = weight × pricePerKG` (no waste logic).

Invoice numbers are auto-generated as: **`SMMS-YYMMDD-XXX`** (e.g. `SMMS-260715-001`).

---

## User Roles

| Role | Access |
|------|--------|
| **ADMIN** | Full access: users, pricing, settings, all transactions |
| **STAFF** | Create customers & transactions, view data |
| **ACCOUNTANT** | View all, manage payments & customers |
| **VIEWER** | Read-only |

---

## Screens / Modules

### 1. Login
- Email + password authentication (JWT)
- Demo users are seeded for quick testing

### 2. Dashboard
- Today’s transaction count
- This month’s revenue
- Total inventory value
- Top customers
- Revenue trend chart (30 days)
- Inventory by material chart
- Recent transactions

### 3. Transactions
- **Incoming:** supplier, material, weight, price → saves invoice + increases stock  
- **Outgoing:** customer, material, weight, price, waste weight, waste toggle → saves invoice + decreases stock  
- Live bill preview before submit  
- Click a row to open the invoice

### 4. Customers
- List / search customers
- Add / edit / soft-delete
- View outstanding balance and full transaction history

### 5. Inventory
- Current stock (KG) and value per material
- Low-stock / out-of-stock alerts
- Movement chart
- Export to CSV

### 6. Billing & Invoices
- Search by invoice number or customer
- View full invoice (company + customer + line items + totals)
- Download PDF / print
- Record partial or full payments (Cash / Bank / Cheque)
- Payment status: `PENDING` → `PARTIAL` → `PAID`

### 7. Reports
- **Daily** — all transactions on a date  
- **Monthly** — revenue, expenses, profit, charts  
- **Customer** — billed / paid / outstanding for one customer  
- **Material** — in/out weight and amounts by material  
- Export to Excel

### 8. Admin Panel (Admin only)
- **Users:** create, edit role/status, reset password, deactivate  
- **Pricing:** set price/KG per material with history  
- **Settings:** company name, GST, bank details, low-stock threshold  
- Export full data backup (JSON)

### 9. Profile
- View logged-in user details
- Change password
- Logout

---

## How Data Is Stored

| Environment | Database | Connection |
|-------------|----------|------------|
| **Current** | **Neon PostgreSQL** (cloud, persistent) | `DATABASE_URL` in `backend/.env` |
| Local fallback | SQLite file | `file:./dev.db` (optional) |

Neon connection example:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
```

After changing the URL:
```bash
cd backend
npx prisma generate
npx prisma db push
node scripts/seed-authentic.js   # optional authentic demo data
node scripts/check-neon.js       # verify Neon connection
```

Every create/update (customer, transaction, payment, stock) is written to Neon permanently.

---

## Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS, React Hook Form, Recharts, date-fns  
- **Backend:** Node.js, Express, Prisma ORM, JWT, bcrypt, Joi, nodemailer  
- **Database:** SQLite (dev) / PostgreSQL (prod)

---

## Quick Start

### Prerequisites
- Node.js 18+

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```
API: **http://localhost:5000**

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App: **http://localhost:3000**

### Demo logins

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@steelmill.com` | `admin123` |
| Staff | `staff@steelmill.com` | `staff123` |
| Accountant | `accountant@steelmill.com` | `account123` |

---

## Verify Database Is Working

```bash
cd backend
node scripts/verify-db.js
```

Or create a transaction in the UI, restart the backend, and confirm the same invoice still appears — that proves persistence.

---

## Project Structure

```
steel-mill-app/
├── frontend/          # Next.js UI (pages, components, charts)
├── backend/           # Express API + Prisma
│   ├── prisma/        # Schema + SQLite file (dev.db)
│   ├── src/           # Routes, controllers, middleware
│   └── scripts/       # DB verification helpers
├── database/          # PostgreSQL SQL schema (reference)
├── docker-compose.yml # Optional Postgres via Docker
└── README.md
```

---

## Deployment Notes

- **Frontend:** Vercel — set `NEXT_PUBLIC_API_URL` to your API URL  
- **Backend:** Railway / Render — set env vars from `backend/.env.example`  
- **Database:** Managed PostgreSQL; switch Prisma schema to `schema.postgresql.prisma`

---

## Summary

SMMS is a complete mill operations app: record incoming/outgoing material with accurate waste billing, keep inventory in sync, manage customers and payments, generate invoices, and run business reports — with role-based access and permanent database storage.
