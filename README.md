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
# from repo root (Next.js app is at root for Vercel)
npm install
npm run dev
```
App: **http://localhost:3000**

Set API URL in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Demo logins

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@steelmill.com` | `admin123` |
| Staff | `staff@steelmill.com` | `staff123` |
| Accountant | `accountant@steelmill.com` | `account123` |

### Test from your phone (same Wi‑Fi)

1. Keep **backend** and **frontend** running on your PC  
2. Find your PC’s Wi‑Fi IP (Windows: `ipconfig` → IPv4, e.g. `192.168.1.10`)  
3. On the phone open: `http://YOUR_PC_IP:3000` (not `localhost`)  
4. Login — the app will call the API at `http://YOUR_PC_IP:5000` automatically  

Allow Node.js through Windows Firewall if the phone can’t connect.

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
├── app/               # Next.js App Router pages
├── components/        # UI components
├── utils/             # API client, auth, helpers
├── styles/            # Global CSS / Tailwind
├── backend/           # Express API + Prisma + Neon
├── database/          # SQL reference schema
├── vercel.json        # Vercel config
└── README.md
```

---

## Deployment Notes

### Architecture

```
Any phone / PC  →  Vercel (Next.js UI)  →  Render/Railway (Express API)  →  Neon DB
```

- **Frontend:** https://steel-mill.vercel.app  
- **Backend:** host on Render (recommended) or Railway — Vercel cannot run this Express API  
- **Database:** Neon (already configured via `DATABASE_URL`)

---

### A) Deploy backend on Render (one-click Blueprint)

1. Open **[https://dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)**  
2. Sign in with **GitHub** (same account as `mianyunas2121/steel-mill`)  
3. Click **New Blueprint Instance**  
4. Select repo **`steel-mill`** (branch `main`)  
5. Render reads `render.yaml` → service name **`smms-api`**  
6. When prompted for **`DATABASE_URL`**, paste your Neon connection string  
   (Neon → Project → Connection Details → copy URI, keep `?sslmode=require`)  
7. Click **Apply** / **Deploy**  
8. Wait until status is **Live**  
9. Open the service → copy the URL, e.g.  
   `https://smms-api.onrender.com`  
10. Test in browser: `https://smms-api.onrender.com/api/health`  
    → should show `{ "success": true, ... }`

**Manual Web Service (if you skip Blueprint):**  
New → Web Service → GitHub `steel-mill` → Root Directory `backend` →  
Build: `npm install && npx prisma generate` → Start: `npm start` →  
Env: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`,  
`FRONTEND_URL=https://steel-mill.vercel.app`

---

### B) Point Vercel frontend at the live API

1. Open **[https://vercel.com/dashboard](https://vercel.com/dashboard)**  
2. Open project **steel-mill** (your Next.js app)  
3. Go to **Settings** → **Environment Variables**  
4. Add / edit:

| Name | Value | Environments |
|------|--------|----------------|
| `NEXT_PUBLIC_API_URL` | `https://smms-api.onrender.com` | Production, Preview, Development |

   (Use **your** real Render URL — no trailing slash)

5. Go to **Deployments** → open the latest → **⋯** → **Redeploy**  
   (Required so `NEXT_PUBLIC_API_URL` is baked into the build)

6. After deploy finishes, open on any phone:  
   **https://steel-mill.vercel.app**  
   Login: `admin@steelmill.com` / `admin123`

---

### C) Deploy backend on Railway (GitHub one-click)

1. Open **[https://railway.app/new](https://railway.app/new)**  
2. Choose **Deploy from GitHub repo**  
3. Select **`mianyunas2121/steel-mill`** (branch `main`)  
4. Railway reads root `railway.toml` / `railway.json` and builds the **backend** API  
5. Open the service → **Variables** → add:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Your Neon URI (`?sslmode=require`) |
| `JWT_SECRET` | Long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://steel-mill.vercel.app` |

6. **Settings** → **Networking** → **Generate Domain** (public HTTPS URL)  
7. Open `https://YOUR-RAILWAY-DOMAIN/api/health` → should return `"success": true`  
8. On Vercel set `NEXT_PUBLIC_API_URL` = that Railway URL (no trailing slash) → **Redeploy**

`backend/railway.toml` is also included if you prefer Root Directory = `backend`.

---

### Notes

- Free Render services **sleep** when idle; first request after sleep can take 30–60s. Railway is usually always-on on paid plans.  
- Never put `DATABASE_URL` or `JWT_SECRET` in Vercel public env (only `NEXT_PUBLIC_API_URL`).  
- Local laptop Wi‑Fi login still works for development: `http://192.168.x.x:3000`.

### Database

- Neon PostgreSQL via `DATABASE_URL` in backend `.env` (local) and Render/Railway (production)

---

## Summary

SMMS is a complete mill operations app: record incoming/outgoing material with accurate waste billing, keep inventory in sync, manage customers and payments, generate invoices, and run business reports — with role-based access and permanent database storage.
