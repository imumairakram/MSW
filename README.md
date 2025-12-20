# 🛒 MSW Enterprises - Full Stack E-Commerce Platform

A complete, responsive e-commerce application designed store. Built using the **MEN Stack** (MongoDB, Express.js, Node.js) with a custom Vanilla JavaScript frontend, this project features a seamless shopping experience for users and a robust management system for administrators.

## 🚀 Live Demo
[Link to Live Demo](https://your-render-link-here.com)  
*(Coming Soon)*

---

## ✨ Key Features

### 👤 User Interface (Frontend)
* **Responsive Design:** Fully optimized for Mobile, Tablet, and Desktop.
* **Product Browsing:** Dynamic product grid with search and category filtering.
* **Shopping Cart:** Real-time cart management with local storage persistence.
* **Secure Checkout:** Integrated order placement system calculating totals and shipping.
* **User Accounts:**
    * Secure Sign Up & Login (JWT Authentication).
    * **Password Recovery:** Email OTP-based password reset system.
    * User Profile to view order history.

### 🛠 Admin Dashboard (Backend)
* **Analytics:** Real-time stats for Total Earnings, Orders, and Low Stock Alerts.
* **Product Management:**
    * Add, Edit, and Delete products.
    * Support for multiple images and product videos.
* **Order Management:**
    * View all customer orders.
    * Update statuses (Pending, Shipped, Delivered, Cancelled).
* **🖨 Automated AWB Generation:** * One-click PDF generation for Shipping Labels (Air Waybills).
    * Auto-calculates weight and formatted dates.

---

## 🛠 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Modern Flexbox/Grid), Vanilla JavaScript (ES6+) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose) |
| **Authentication** | JSON Web Tokens (JWT), Bcrypt.js |
| **File Handling** | Multer (Local Uploads) |
| **Email Service** | Nodemailer (Gmail SMTP) |
| **PDF Generation** | html2pdf.js |

---

## 📸 Screenshots

| Home Page | Shop Grid |
| :---: | :---: |
| ![Home](https://drive.google.com/uc?export=view&id=1Bn4wJVzC4_WUSNfPclQWd_rDONrV4Jdp) | ![Shop](https://drive.google.com/uc?export=view&id=1XffCgzIKQzd7cPNndbOh7LqP0M8NMcho) |

| Admin Dashboard | AWB Label |
| :---: | :---: |
| ![Admin](https://drive.google.com/uc?export=view&id=1kIXIurIPO3e8zWEMvt4MCwD76bnBMWcq) | ![AWB](https://drive.google.com/uc?export=view&id=1YV5WIobvyLWU4WU6CEGF51NDHpDNGkSf) |
---

## 📂 Project Structure

The project is organized into a clear directory structure separating the frontend user interface, backend logic, and static assets.

```text
msw-enterprises/
│
├── 📁 assets/               # Static assets (Logos, Icons, Images used in UI)
├── 📁 uploads/              # Dynamic folder for product images/videos uploaded by Admin
│
├── 📜 server.js             # Main Backend Entry Point (Express App, API Routes, DB Connection)
├── 📜 package.json          # Project Dependencies and Scripts
├── 📜 .env                  # Environment Variables (Port, Mongo URI, Secrets) - *Not uploaded to Git*
│
├── 📄 index.html            # Home Page (Product Highlights, Hero Section)
├── 📄 shop.html             # Product Listing Page (Grid view, Search, Categories)
├── 📄 product-details.html  # Single Product View (Description, Add to Cart)
├── 📄 cart.html             # Shopping Cart Page (Manage items, Subtotal)
├── 📄 checkout.html         # Checkout Page (User Details, Order Placement)
├── 📄 myaccount.html        # User Authentication (Login, Signup, Forgot Password)
├── 📄 user-profile.html     # User Dashboard (Order History, Profile Settings)
├── 📄 contactus.html        # Contact Page (Email Form)
├── 📄 aboutus.html          # About Company Page
│
├── 📄 admin-login.html      # Admin Authentication Page
├── 📄 admin.html            # Admin Dashboard (CMS, Order Management, Analytics)
├── 📄 AWB.html              # Printable Template for Shipping Labels (Air Waybills)
│
└── 📝 README.md             # Project Documentation
