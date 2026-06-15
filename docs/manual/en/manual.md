# DFlowERP — User Manual

**Version:** 0.3.0 | **Language:** English | **Date:** 2026

---

## Table of Contents

1. [Introduction](#introduction)
2. [Login](#login)
3. [Dashboard](#dashboard)
4. [Users](#users)
5. [Warehouse Management (WMS)](#warehouse-management-wms)
6. [Supply Chain Management (SCM)](#supply-chain-management-scm)
7. [Manufacturing (MES)](#manufacturing-mes)
8. [Point of Sale (POS)](#point-of-sale-pos)
9. [Backup](#backup)
10. [Settings](#settings)
11. [Roles and Permissions](#roles-and-permissions)

---

## 1. Introduction

DFlowERP is a modular ERP system designed for small and medium businesses.
The system runs entirely in the browser and does not require additional software installation.

### Supported Browsers

| Browser | Support |
|---------|---------|
| Google Chrome | ✅ Recommended |
| Mozilla Firefox | ✅ Supported |
| Microsoft Edge | ✅ Supported |
| Apple Safari | ⚠️ Partial support |

### System Access

The system is available at: `http://[server-IP-address]:3001`

---

## 2. Login

### Login Steps

1. Open your browser and enter the system address
2. Enter your **email address** and **password**
3. Click the **"Login"** button

### Forgotten Password

If you forget your password, contact your system administrator.

### Automatic Logout

The system automatically logs out after a period of inactivity for security.

---

## 3. Dashboard

The dashboard is the home page after logging in.

### What the Dashboard Shows

| 📦 Warehouse Management | Number of warehouses, items in stock, draft receipts |
|-------------------------|------------------------------------------------------|
| 🚚 Supply Chain | Number of suppliers, pending orders |
| 🏭 Manufacturing | Active BOMs, work orders in progress |
| 🛒 Point of Sale | Registers, today's sales, today's revenue |
| 💾 Backup | Active policies, last backup |

### Navigation

- Click **"View →"** on each card to open the corresponding module
- Red numbers indicate **warnings** (e.g. items below minimum stock)

---

## 4. Users

> 🔒 Access: SUPER_ADMIN, ADMIN

### Adding a User

1. Go to **Users** in the menu
2. Fill in the form: Email, Password, Role
3. Click **"Add"**

### User Roles

| Role | Description |
|------|-------------|
| SUPER_ADMIN | Full access to everything |
| ADMIN | User management and settings |
| MANAGER | Access to all modules without settings |
| OPERATOR | Work with modules without delete |
| READONLY | Read only |

### Changing a Password

1. Find the user in the list
2. Click the 🔑 icon
3. Enter the new password
4. Confirm with **"Save"**

---

## 5. Warehouse Management (WMS)

This module manages warehouses, stock levels, and goods movements.

### 5.1 Warehouses

#### Adding a Warehouse

1. Go to **Warehouse Management → Warehouses**
2. Fill in: Code (e.g. WH-01), Name, Address
3. Click **"Create"**

#### Warehouse Locations

Each warehouse has locations (e.g. A-01, B-02) for precise stock tracking.

### 5.2 Products

#### Adding a Product

1. Go to **Warehouse Management → Products**
2. Fill in: Code, Name, Unit of measure
3. Optional: Barcode, Minimum stock, Price
4. When creating, you can enter **Initial stock** and select a warehouse
5. Click **"Create product"**

#### Barcode Scanner

- Click the 📷 icon next to the barcode field
- Choose mode: **USB/Bluetooth scanner** or **Camera**
- Point the scanner at the barcode

### 5.3 Stock

Shows current stock by product and location.

| Status | Meaning |
|--------|---------|
| ✅ Normal | Stock is above minimum |
| ⚠️ Below minimum | Stock is below the set minimum |

#### Filter by Warehouse

Use the dropdown at the top right to filter by a specific warehouse.

### 5.4 Receipts (Goods In)

#### Creating a Receipt Document

1. Go to **Warehouse Management → Receipts**
2. Select a warehouse and enter the supplier
3. Click **"Create"**
4. In the detail view, add items
5. Click **"Confirm"** to post the receipt

### 5.5 Issues (Goods Out)

Same process as Receipts but for outgoing goods.

### 5.6 Movements

Shows full history of all warehouse movements with type (In/Out/Transfer/Adjustment).

### 5.7 Reports (WMS)

Three sections:

- **Movements** — chart of ins/outs by period
- **Stock** — stock by item with chart
- **Receipts** — receipt documents by period

#### Period Filter

Choose: 7 days / 30 days / 90 days / Custom (from-to date)

#### Excel Export

Click the **"Export Excel"** button at the top right.

---

## 6. Supply Chain Management (SCM)

### 6.1 Suppliers

#### Adding a Supplier

1. Go to **Supply Chain → Suppliers**
2. Fill in: Code, Name, Contact, Phone, Email
3. Click **"Create"**

### 6.2 Purchase Orders

#### Creating an Order

1. Select a supplier from the dropdown
2. Click **"Create"**
3. Add items and quantities
4. Change status to **"Sent"** when you send the order

#### Order Statuses

| Status | Meaning |
|--------|---------|
| 📝 Draft | Order is being prepared |
| 📤 Sent | Order sent to supplier |
| 📦 Received | Goods have been received |
| ❌ Cancelled | Order was cancelled |

### 6.3 Deliveries

When receiving goods:

1. Go to **Deliveries**
2. Link to a purchase order
3. Confirm received quantities
4. **Confirm** → automatically creates a WMS receipt document

---

## 7. Manufacturing (MES)

### 7.1 Bill of Materials (BOM)

A BOM describes what materials are needed to produce a finished product.

#### Creating a BOM

1. Go to **Manufacturing → BOM**
2. Select finished product and version
3. Click **"Create"**
4. In the detail view, add components (materials + quantities)

### 7.2 Work Orders

#### Creating a Work Order

1. Select a BOM and quantity
2. Select warehouse and output location
3. Click **"Create"**

#### Statuses

| Status | Meaning |
|--------|---------|
| 📋 Planned | Work order created |
| ⚙️ In Progress | Production started |
| ✅ Completed | Production finished |
| ❌ Cancelled | Work order cancelled |

---

## 8. Point of Sale (POS)

### 8.1 Register (Terminal)

#### Making a Sale

1. Go to **Point of Sale → Register**
2. Select a register from the dropdown
3. Add products:
   - Click a product to add it
   - Or click **"Scan"** for barcode scanner
4. Select payment method: **Cash** or **Card**
5. Click **"Complete Sale"**

#### Receipt

After completing a sale, a receipt is shown with:

- Company details (from Settings → Company)
- List of items
- Total amount and VAT (if applicable)
- Payment method

You can: **Print**, **Download**, or continue with **New Sale**

#### Invoice

Check **"Issue Invoice"** before completing the sale.

### 8.2 Sales (History)

Shows all completed sales with details.

### 8.3 Registers (Management)

Manage physical registers in the system.

---

## 9. Backup

### 9.1 Policies

A policy defines when and how backups run.

#### Creating a Policy

1. Go to **Backup → Policies**
2. Set: Name, Frequency (daily/weekly), Time
3. Click **"Create"**

### 9.2 Backup History

Shows all completed backups with status and size.

### 9.3 Restore Points

To restore data from a specific point, contact your system administrator.

---

## 10. Settings

> 🔒 Access: SUPER_ADMIN, ADMIN

### 10.1 Profile

Change your own: Email, Password, Names

### 10.2 Company

Company data used in receipts and invoices:

- Name, Manager
- EIK/VAT ID, VAT number
- Address, City, Country
- Phone, Email
- Bank, IBAN
- Logo (URL)

### 10.3 License

Shows information about the current license:

- Validity and expiry date
- Active modules
- Maximum number of users

### 10.4 System

Technical information about the installation.

---

## 11. Roles and Permissions

| Function | READONLY | OPERATOR | MANAGER | ADMIN | SUPER_ADMIN |
|----------|----------|----------|---------|-------|-------------|
| View data | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create records | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edit | ❌ | ✅ | ✅ | ✅ | ✅ |
| Delete | ❌ | ❌ | ✅ | ✅ | ✅ |
| User management | ❌ | ❌ | ❌ | ✅ | ✅ |
| System settings | ❌ | ❌ | ❌ | ✅ | ✅ |
| License and versions | ❌ | ❌ | ❌ | ❌ | ✅ |
