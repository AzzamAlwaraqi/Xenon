# Backend Architecture & Audit Report

This document contains the complete explanation of the backend architecture as well as the 3-phase audit you requested.

## Phase 4: Backend Architecture & Explanation

**1. High-Level Architecture**
This backend is built using **Node.js** and **Express.js**. It serves as a RESTful API communicating with a MongoDB database via **Mongoose**. The system is organized using an MVC-like structure where requests are routed through Express routers (`src/Routes`), handled by specific controllers (`src/controllers`), and data is manipulated using Mongoose models (`src/Models`). It also includes Docker integration (`dockerode`) for container management.

**2. Domain Entities & Models**
The system revolves around several core entities located in `src/Models`:
* **UserModel:** The core entity for authentication and profile management. It supports distinct roles: `admin`, `user`, and `vendor`.
* **VendorModel:** Stores specific vendor-related data, likely extending or linked to the core User model.
* **Client / Admin / Vendor domains:** The controllers are strictly separated into these three distinct actors (`src/controllers/Admin`, `Client`, `Vendor`).
* **Operational Entities:** `BookingModel` (handling reservations), `PackageModel` (handling services or products offered), `ComplaintModel` (handling user issues), and `ReviewModel` (user feedback).
* **Session:** Manages user sessions, likely for JWT or token tracking.

**3. API Overview**
The API is grouped by actors and features under `/api/v1/`:
* `/api/v1/clients`: Handles client-specific actions like creating a client (`/create-client`), fetching/updating profiles, changing passwords, and retrieving client reviews.
* `/api/v1/docker`: Suggests an integration to manage or interact with Docker containers dynamically from the backend.
* Additional routes (though not yet mounted in `app.js`) exist for `adminRoutes`, `vendorRoutes`, `bookingRoutes`, `packageRoutes`, and `aiRoutes`.

**4. Intended Workflow**
A typical request (e.g., a Client updating their profile) follows this lifecycle:
1. **Request:** The client sends an HTTP `PUT` request to `/api/v1/clients/update-profile`.
2. **Middleware:** The request passes through global middlewares (`cors`, `express.json()`) and should pass through an `authMiddleware` to verify the user's JWT token.
3. **Router:** The `clientRoutes.js` file routes the request to the `clientProfileController.updateprofile` function.
4. **Controller:** The controller extracts the user ID and the fields to be updated, applies any business logic, and interacts with the `UserModel`.
5. **Database:** Mongoose translates the operation into a MongoDB query and returns the updated document.
6. **Response:** The controller formats the successful update into a standard JSON response or passes any errors to the `AppError` global error handler.

---

## Code Audit (Phases 1-3)

### Phase 1: Packaging & Project Structure
1. **CLI Configuration:** The `angravity.json` configuration file is missing. Furthermore, the `package.json` has an incorrect `"main"` property pointing to `index.js`, while the server actually runs from `src/server.js`.
2. **Directory Structure:** Folder casing is inconsistent (`Routes` and `Models` are capitalized, while `controllers` and `middlewares` are lowercase). `config.env` is placed inside the `src` directory instead of the project root.
3. **Dependencies:** The `dev` script utilizes `nodemon`, but it is completely missing from `devDependencies` in `package.json`. Critical security packages like `bcryptjs` (for password hashing) are also missing.

### Phase 2: Application Logic Audit
1. **Error Handling:** Controllers correctly use `next(new AppError(...))`, but the global error handler middleware (`src/middlewares/errorHandler.js`) is **never mounted** in `app.js`. Express will fall back to its default HTML error page instead of JSON.
2. **Data Flow & Security:** In `src/Routes/clientRoutes.js`, the `/profile` route expects `req.user` and `req.token`, but there is **no authentication middleware** attached to protect it.
3. **Incomplete Controllers:** Empty controllers like `loginClient` and `logoutClient` lack response logic and will leave client requests hanging indefinitely.

### Phase 3: Database Integration & Integrity
1. **Models & Schemas (Critical Vulnerability):** `src/Models/UserModel.js` defines a password field, but there is **no pre-save hook to hash this password**. In `clientAuthController.js`, the password is saved directly as plaintext.
2. **Connection Management:** `config.env` holds plain text database credentials and is committed inside the `src/` directory. `dbConfig.js` relies on a manual string replacement for the `<PASSWORD>` field instead of a standard fully formed `DATABASE_URI`.

### Corrected Code Snippets

**1. Hashing Passwords in UserModel.js:**
```javascript
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Ensure this is installed

const UserSchema = new mongoose.Schema({
    // ... other fields ...
    password: { type: String, min: 8, required: true }
});

UserSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});
module.exports = mongoose.model("User", UserSchema);
```

**2. Fixing the Error Handler in app.js:**
```javascript
const globalErrorHandler = require("./middlewares/errorHandler");

// ...
app.use("/api/v1/clients", clientRoutes);
app.use("/api/v1/docker", dockerRoutes);

// Mount the error handler at the very end
app.use(globalErrorHandler);
module.exports = app;
```

**3. Protecting Routes in clientRoutes.js:**
```javascript
const express = require("express");
const { createClient } = require("../controllers/Client/clientAuthController");
const clientProfileController = require("../controllers/Client/clientProfileController");
const authMiddleware = require("../middlewares/authMiddleware"); 
const router = express.Router();

router.post("/create-client", createClient);

// Apply auth middleware to protect all routes below
router.use(authMiddleware); 
router.get("/profile", clientProfileController.getprofile);
```