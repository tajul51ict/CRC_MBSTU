# Come for Road Child (CRC), MBSTU
### Volunteer & Activity Management System

A clean, modern, and professional web application designed for **Come for Road Child (CRC)**, a voluntary student organization at **Mawlana Bhashani Science and Technology University (MBSTU)** dedicated to the education, welfare, and social upliftment of underprivileged street children in Tangail, Bangladesh.

---

## 🌟 Key Features

### 1. Visitor (Public)
* **Homepage**: Interactive hero banner, organizational introduction, live statistics, upcoming activities preview, executive committee preview, and gallery preview.
* **About Page**: Mission, vision, core values, initiatives ("What We Do"), and "Why Volunteer" guides.
* **Activities & Details**: Dynamic listing with status filters (Upcoming, Ongoing, Completed), comprehensive event detail view, and direct registration button.
* **Committee & Gallery**: Dynamic leadership directory and responsive image grid showcasing past campaigns.
* **Registration & Login**: Secure student onboarding with student ID, department, and batch details.

### 2. Member (Active Volunteer)
* **Dedicated Dashboard**: Overview of available activities, personal participation statistics, and upcoming drives.
* **Join Activity**: Single-click participation in upcoming activities with duplicate entry prevention (`UNIQUE(user_id, activity_id)`).
* **My Activities**: Complete record of all drives joined by the volunteer with timestamps and direct event links.

### 3. Administrator (CRC Executive Admin)
* **Dashboard Overview**: Live counter cards (Active Members, Pending Approvals, Activities, Committee, Gallery) and recent pending requests.
* **Volunteer Approval System**: Review student registrations with instantaneous one-click **Approve** or **Reject** capabilities.
* **Activity Management (CRUD)**: Create, edit, delete, and upload banners for activities with real-time status management.
* **Committee Management (CRUD)**: Add, update, delete executive members with official university designations and photo uploads.
* **Gallery Management**: Upload event photographs with captions and remove obsolete media.

---

## 🛠️ Technology Stack

* **Frontend**: HTML5, CSS3, Bootstrap 5 (Responsive for Mobile, Tablet, and Desktop), Vanilla JavaScript (using native `fetch()` API).
* **Backend**: Node.js, Express.js (REST API architecture).
* **Database**: MySQL with `mysql2/promise` connection pooling.
* **Security & Auth**: `bcryptjs` password hashing, JSON Web Tokens (JWT), role-based middleware access control.
* **Media Handling**: `multer` with file extension and MIME type validation.

---

## 📂 Project Structure

```text
CRC_MBSTU/
│
├── index.html                  # Public Homepage
├── about.html                  # About CRC, Mission & Vision
├── activities.html             # Public Activities directory
├── activity-details.html       # Activity Details & Join portal
├── gallery.html                # Public Activity Gallery
├── committee.html              # Executive Committee Directory
├── login.html                  # Unified Login Portal
├── register.html               # Volunteer Registration Form
├── package.json                # Dependencies & npm scripts
├── .gitignore                  # Git ignore rules
├── .env.example                # Template for environment variables
├── .env                        # Local environment credentials
├── README.md                   # Complete documentation
│
├── css/
│   └── style.css               # Custom theme styles & layout tokens
│
├── js/
│   └── script.js               # Vanilla JS REST API client
│
├── server/
│   ├── server.js               # Express application entry point
│   ├── db.js                   # MySQL2 connection pool
│   ├── middleware/
│   │   ├── auth.js             # JWT verification & role authorization
│   │   └── upload.js           # Multer image upload security
│   ├── routes/
│   │   ├── auth.js             # Authentication endpoints
│   │   ├── activities.js       # Activity endpoints
│   │   ├── members.js          # Member management & stats
│   │   ├── committee.js        # Committee management
│   │   └── gallery.js          # Gallery endpoints
│   └── controllers/
│       ├── authController.js   # Registration, login & session logic
│       ├── activityController.js
│       ├── memberController.js
│       ├── committeeController.js
│       └── galleryController.js
│
├── admin/
│   ├── dashboard.html          # Admin stats & pending list
│   ├── members.html            # Member approval/rejection
│   ├── activities.html         # Activity CRUD
│   ├── committee.html          # Committee CRUD
│   └── gallery.html            # Gallery image manager
│
├── member/
│   ├── dashboard.html          # Volunteer personal dashboard
│   └── my-activities.html      # Personal activity record
│
├── uploads/
│   ├── activities/             # Uploaded activity images
│   ├── committee/              # Uploaded committee photos
│   └── gallery/                # Uploaded gallery photos
│
└── database/
    └── crc_mbstu_db.sql        # MySQL database schema & seed data
```

---

## ⚙️ Prerequisites

1. **Node.js** (v18 or higher recommended, tested on v24)
2. **MySQL Server** (XAMPP, WampServer, or standalone MySQL Server running on port 3306)

---

## 🚀 Setup & Installation Instructions

### Step 1: Install Node.js Dependencies
Open your terminal inside the project directory and run:
```bash
npm install
```

### Step 2: Configure the Database
1. Make sure your MySQL service is running.
2. Open your MySQL client (e.g. phpMyAdmin, MySQL Workbench, or Command Prompt).
3. Import the SQL file located at:
   ```text
   database/crc_mbstu_db.sql
   ```
   *Via MySQL CLI:*
   ```bash
   mysql -u root -p < database/crc_mbstu_db.sql
   ```
   *Or automatically via Node:*
   ```bash
   node -e "const fs = require('fs'); const mysql = require('mysql2'); const sql = fs.readFileSync('database/crc_mbstu_db.sql', 'utf8'); const conn = mysql.createConnection({host:'localhost', user:'root', password:'YOUR_PASSWORD', multipleStatements: true}); conn.query(sql, (err) => { if(err) console.error(err); else console.log('Imported successfully!'); conn.end(); });"
   ```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory (copied from `.env.example`):
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=crc_mbstu_db
DB_PORT=3306
JWT_SECRET=crc_mbstu_super_secret_jwt_key_2026_change_in_production
SESSION_SECRET=crc_mbstu_session_secret_key_change_in_production
```
*(Adjust `DB_PASSWORD` to match your local MySQL root password if different).*

### Step 4: Start the Server
Run the application using:
```bash
npm start
```
Or with auto-reload during development:
```bash
npm run dev
```

### Step 5: Open the Web Application
Open your browser and navigate to:
```text
http://localhost:5000/
```
The application will automatically serve `index.html`.

---

## 🔑 Demo Login Credentials

The database script automatically seeds the following verified accounts:

### 1. Administrator Account
* **Role**: Admin (Full Access to `/admin/*`)
* **Email**: `admin@crcmbstu.com`
* **Password**: `Admin@12345`

### 2. Active Member Account
* **Role**: Member (Access to `/member/*`)
* **Email**: `member@crcmbstu.com`
* **Password**: `Admin@12345`

### 3. Pending Registration Test
* **Role**: Member (Status: `pending`)
* **Email**: `pending@crcmbstu.com`
* **Password**: `Admin@12345`
*(Attempting to log in will display the requirement for admin approval).*

---

## 🔒 Security Best Practices Implemented

* **Bcrypt Password Hashing**: Passwords are never stored in plain text.
* **Role-Based Access Control (RBAC)**: Enforced via Express middleware (`requireAdmin`, `requireMember`).
* **Prepared SQL Queries**: Parameterized queries using `mysql2` prevent SQL injection attacks.
* **File Upload Protections**: Extension whitelist (`.jpg`, `.jpeg`, `.png`, `.webp`), MIME type validation, and file size limits.
* **Safe Error Handling**: Prevents leaking raw database error messages or server paths to the frontend.
* **Separation of Concerns**: HTML structure, CSS styling, and Vanilla JS API logic reside in completely distinct files.

---

## 🌐 Production Deployment Guide

1. **Host Requirements**: Any cloud provider supporting Node.js (e.g., Render, Railway, DigitalOcean, VPS, AWS) and a managed MySQL database (e.g., PlanetScale, Aiven, or Railway MySQL).
2. **Environment**: Add the environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, etc.) to the hosting platform's environment settings.
3. **Build & Start**: Run `npm install` and start with `node server/server.js`.
4. The system is designed with relative URLs, allowing it to seamlessly deploy at root domain `https://YOUR-DOMAIN/` or any port.

---

## 📜 License
Developed for educational demonstration and volunteer community management for **Come for Road Child (CRC), MBSTU**.
