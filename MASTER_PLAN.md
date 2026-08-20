# 🔄 Application Flow-Based Master Plan

```
[ Flow 1: Customer Storefront ] ➔ [ Flow 2: Checkout & Ordering ] ➔ [ Flow 3: Admin Fulfillment ] ➔ [ Flow 4: Store Operations ] ➔ [ Flow 5: Infrastructure ]
```

---

## 🛍️ Phase 1: Customer Storefront Flow (Browsing & Discovery)

**Goal:** Build the public-facing UI that customers see when they first open the store app on their phones or computers.

### Header & Navigation
* **Store Details:** Store logo, contact info, operating hours.
* **Cart Counter:** Active cart item counter.
* **Quick-access Buttons:**
  * Upload Prescription
  * Store Pickup Toggle
  * WhatsApp Support

### Category & Product Catalog Grid
* **Category Filter Pills:**
  * Medicines
  * Baby Care
  * Hygiene
  * OTC & First Aid
  * General Store
* **Product Cards:** Featuring image, title, price, stock status, dosage variants (e.g., 250mg / 500mg), and a prominent `Requires Prescription` badge for pharmacy items.
* **Safety & Temperature Badges:** Visual indicators for items requiring cold chain storage (`2°C - 8°C Refrigerated`).

### Search & Generic Alternatives
* **Instant Search Bar:** Filtering by brand name or generic medicine name (e.g., searching *"Paracetamol"* shows all matching brands).
* **Generic Substitution Suggestions:** Automated alternative brand recommendation engine when viewing product details or when an item is low in stock.

### Interactive Shopping Cart
* **Slide-out Cart Drawer:** Allowing quantity adjustments, item removal, and automatic subtotal calculations.

---

## 📑 Phase 2: Checkout & Prescription Upload Flow

**Goal:** Guide the customer through submitting their order or medical prescription smoothly.

### Prescription Upload Gateway
* Dedicated photo upload screen with client-side image compression (to handle mobile uploads fast).
* Customer details input form: Name, Phone Number, Delivery Address, Optional Doctor Notes.

### Locality & Delivery Radius Checker
* Dropdown selection for local delivery zones/neighborhoods to calculate custom delivery fees or enforce minimum order limits.

### Flexible Checkout Options
* **Standard Checkout:** Choose between Home Delivery (Cash on Delivery) or Click & Collect (Store Pickup).
* **WhatsApp Fast Order:** Auto-generates a formatted WhatsApp text payload detailing cart items, quantities, total price, and customer details sent directly to the store’s phone number.

### Order Status & Prescription Tracking
* **Visual Progress Stepper:**  
  `Received` $\rightarrow$ `Pharmacist Verified / Packing` $\rightarrow$ `Out for Delivery` $\rightarrow$ `Delivered`
* **Automated Status Notifications:** Real-time updates on prescription approval or order status.

---

## 📦 Phase 3: Admin Order Processing & Prescription Verification Flow

**Goal:** Build the interface for store staff to receive, inspect, and fulfill incoming requests in real-time.

### Protected Admin Login
* Secure login page with JWT auth to protect store tools from public access.

### Prescription Review Inbox & Verification
* Dedicated inbox showing incoming prescription uploads tagged as `Pending`.
* **Clickable Image Modal Viewer:** Inspect prescription photos, review customer details, and execute actions (`Verify Order`, `Reject`, or `Call / Direct WhatsApp Customer`).
* **Pharmacist Sign-Off Log:** Record which staff member/pharmacist verified and approved the prescription for compliance.

### Order Fulfillment Queue
* Admin dashboard view to manage incoming cart orders.
* Status updater buttons to push orders through delivery stages and print clean delivery slips/invoices.

---

## 📊 Phase 4: Back-of-House Store Operations Flow

**Goal:** Give the store owner complete control over pricing, inventory stock, expiring batches, and suppliers.

### Dynamic Rate & Batch-Wise Stock Management
* **Inline Quick-Edit Table:** Spreadsheet-style table view to edit product prices and stock numbers directly in row inputs and save instantly.
* **Batch-Level Inventory Tracking:** Manage items by Batch Number (`Batch #`, `Mfg Date`, `Expiry Date`, `Purchase Cost`, `Selling Price`).
* **Bulk Category Pricing Tool:** Apply percentage or flat rate price adjustments across entire product categories at once.

### Inventory Addition & Supplier Uploads
* **Single-item Upload Modal:** Capturing Title, Generic Name, Category, Batch Details, Prices, Stock, Requires Prescription toggle, Cold Storage flag, and Cloudinary photo.
* **Bulk CSV/Excel Importer:** Import large distributor stock lists in seconds.

### POS Lite & Counter Sales
* **1-Click Counter Sale:** Deduct physical inventory immediately when a customer buys an item in the physical shop.
* **Thermal Printer (80mm) Receipt Generator:** Quick billing with support for Cash, EasyPaisa/JazzCash QR, and Card payments.

### Expiry Date & Controlled Items Alert System
* Automated dashboard table alerting staff of items approaching expiration within 30, 60, or 90 days.
* Low-stock warnings and controlled substance audit tag tracking.

### Supplier Directory & Restock Analytics
* Vendor contact list and auto-generated restock lists based on low or expiring stock.
* Daily sales summary, profit margin insights, and register balancing reports.

---

## ⚙️ Phase 5: Technical Architecture, API & Database Setup

**Goal:** Build the backend engine that powers all the flows above using the MERN stack.

### Express REST API & Middleware
* Node.js / Express server setup with CORS, authentication middleware (`adminOnly`), and route handlers.

### Database Schemas (Mongoose)
* **Product & Batch Schema:** Prices, stock levels, batch numbers, expiry dates, dosage, cold storage flags, prescription flags.
* **Prescription Schema:** Customer info, Cloudinary image URL, pharmacist approval log, verification status, notes.
* **Order Schema:** Items, address, delivery type, payment status, tracking status.
* **User & Audit Log Schema:** Auth, roles, admin action audit trail (price edits, manual stock adjustments).

### Stock Reservation Engine
* Implementation of `reservedStock` locking mechanism to prevent race conditions between online orders and counter POS sales.

### Cloudinary Integration
* Express routes using `multer` to stream uploaded product photos and user prescription images directly to Cloudinary.

---

## 🧪 Phase 6: Testing, Optimization & Deployment

**Goal:** Ensure sub-second mobile page loads, security, and cloud deployment.

### Performance & Security
* Cloudinary WebP image compression for fast mobile loading.
* MongoDB database indexing on search fields (`name`, `category`, `genericName`).

### Deployment Strategy
* **Frontend:** Deployed on Vercel or Netlify.
* **Backend API:** Deployed on Render, Railway, or Node cloud platform.
* **Database:** Hosted on MongoDB Atlas.
