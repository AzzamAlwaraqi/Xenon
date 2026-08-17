# Xenon - Travel Booking & Tour Management Platform

Xenon is a production-grade, highly scalable travel booking and tour management backend platform. Built on top of Node.js, Express, and MongoDB/Mongoose, it establishes a reliable, secure, and transactional API surface for Clients, Vendors, and Administrators.

## 📌 Overview

Xenon is designed as a three-sided digital marketplace facilitating the discovery, management, scheduling, and reservation of travel packages and experiences. It coordinates the operations of:
- **Clients (Tourists):** Browse packages, create reservations, register reviews, and file complaints.
- **Vendors (Tour Operators & Agencies):** Manage business profiles, establish travel packages, control guest capacities, and process bookings.
- **Administrators:** Moderate content, approve new vendors, oversee compliance/complaints, and track platform-wide analytics.

## 🛠️ Tech Stack & Technologies Used

- **Runtime Environment:** Node.js
- **Web Framework:** Express.js
- **Database:** MongoDB
- **ODM (Object Data Modeling):** Mongoose
- **Primary Keys & Identifiers:** UUIDv7 (Cryptographically secure and chronologically sortable)
- **Authentication & Security:** 
  - `bcrypt` (12 rounds) for password hashing
  - Joi for strict input payload validation
  - Custom Session Tracking for cross-device login management
  - OTP (One-Time Password) generation via `crypto` module
- **File Storage & Image Processing:** Cloudinary API integrated with `sharp`
- **Email Delivery:** Nodemailer (with a mock provider for development environments)

## 🚀 Key Features

- **Atomic Transactions:** Utilizes Mongoose session transactions (`mongoose.startSession()`) for critical operations like Vendor Registration and Package Bookings to ensure complete data integrity and prevent overbooking.
- **Smart Capacity Engine:** Automatically calculates current booked guests and limits reservations based on the vendor's package capacity.
- **Advanced Session Management:** Tracks logins with device identifiers, OS names, IP addresses, and browser types, linked via a `family_id` to trace cross-device logins.
- **Soft Deletion Mechanism:** Accounts and records are soft-deleted (`isDelete: true`) with a 30-day grace period for recovery before permanent deletion.
- **Unified Error Handling:** Custom `AppError` class extending native JS Error to maintain consistent API error responses (e.g., 400, 401, 403, 404, 500).

## 📂 Project Architecture

The project follows a decoupled, modular architecture separating routing, validation, business logic, and integrations:

- **`/src/Routes`:** Maps REST paths to validations and controllers.
- **`/src/controllers`:** Receives API requests, validates inputs, and delegates to services.
- **`/src/services/Core`:** Implements core business logic, database CRUD operations, and transactional calculations.
- **`/src/services/Integration`:** Manages third-party connections (Emails, Cloudinary, AI services).
- **`/src/Models`:** Defines Mongoose database schemas.
- **`/src/validations`:** Contains Joi validation schemas.
- **`/src/utils`:** Shared utilities (Date formatters, OTP service, Error formatting).

## 💻 Getting Started

### Prerequisites
- Node.js (Active LTS version)
- MongoDB instance (Local or Atlas)
- Cloudinary Account
- SMTP Server details (for emails)

### Installation

1. Clone the repository and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `src/config.env` (Port, DB URI, JWT Secrets, Cloudinary keys, etc.)
4. Start the development server:
   ```bash
   npm run dev
   ```

## 📜 License
ISC License
