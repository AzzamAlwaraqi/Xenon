# Xenon Backend - Resolved Issues & Changelog

This document details the issues resolved, the APIs modified, and the bugs fixed based on user requests and the critical findings listed in `docs/errors.md`.

## 1. Comprehensive Integration Testing
**Problem:** Need comprehensive integration tests to ensure exact application behaviors across all controllers (Status Codes: 200, 400, 401, 403).
**Solution:**
- Created `tests/controllers/allBehaviors.test.js`.
- Implemented **97 passing tests** guaranteeing:
  1. Valid payloads return `200 OK` or `201 Created`.
  2. Joi validation failures accurately return `400 Bad Request` without stack leaks.
  3. Missing/invalid JWT tokens accurately return `401 Unauthorized` with exact error bodies.
  4. Role-Based Access Control (RBAC) violations accurately return `403 Forbidden` with exact error bodies.

## 2. Authentication & Registration Workflow Fixes
**Problem:** Normal vendor registrations crashed and left partial data because `newVendor` was undefined, throwing a 500 server error and consuming the user's OTP.
- **Modified APIs:** `POST /api/v1/auth/register`
- **Fix:** Refactored `createAccountCore` in `src/services/Core/authCore.js`. The logic no longer blindly defaults `actualRole` to "user". If the role requested is "vendor", it now correctly instantiates and saves a `VendorModel` linked to the user.

**Problem:** OTP-by-phone was declared in the codebase but was practically impossible to use because the `phone` key was missing from Joi validation and stripped.
- **Modified APIs:** `POST /api/v1/auth/send-otp`, `POST /api/v1/auth/verify-otp`
- **Fix:** Added `phone` parameter validation (enforcing Jordan Mobile Regex) to `sendOtpValidation` and `verifyOtpValidation` in `src/validations/authValidation.js`.

**Problem:** Password confirmation could be dangerously omitted during a password reset because the validator silently copied the `newPassword` into the confirmation field if it was missing.
- **Modified APIs:** `POST /api/v1/auth/reset-password`
- **Fix:** Removed the `req.body.newPassword` fallback mapping from `resetPasswordValidation` in `src/validations/authValidation.js`.

**Problem:** Walk-in customers created during vendor booking could not be saved, throwing a `StrictModeError` for invalid properties (`isVerified`, `passwordConfirm`) and crashing because `email` was missing.
- **Modified APIs:** `POST /api/v1/bookings/create-booking`
- **Fix:** Cleaned up the walk-in customer block in `src/services/Core/bookingCore.js`. Generated a dummy email (`walkin_{phone}@xenon.local`) and removed the schema-violating fields.

## 3. Review Workflow Fixes
**Problem:** Review comments were optional in Joi validation but strictly required by Mongoose, leading to 500 database errors.
- **Modified APIs:** `POST /api/v1/reviews/createReview`
- **Fix:** Updated the `comment` field inside `createReviewSchema` (`src/validations/reviewValidation.js`) to be strictly `.required()`.

**Problem:** Reviews were inappropriately permitted for trips that were merely "Accepted" but not actually completed.
- **Modified APIs:** `POST /api/v1/reviews/createReview`
- **Fix:** Modified `createReviewCore` in `src/services/Core/Client/reviewCore.js` to ensure the target booking's status is explicitly `Completed` before allowing the review.

**Problem:** The public package-review route did not validate `packageId` as a valid UUID.
- **Modified APIs:** `GET /api/v1/reviews/package/:packageId`
- **Fix:** Updated `paramIdValidation` in `src/validations/reviewValidation.js` to look for and validate `req.params.packageId`. Inserted this middleware into the route (`src/Routes/reviewRouter.js`).

**Problem:** Vendor review-reply logic existed in the core service but was completely inaccessible because it lacked a controller and route.
- **Modified APIs:** Created `POST /api/v1/reviews/reply/:id`
- **Fix:** Built `replyToReview` in `src/controllers/Client/reviewController.js` and exposed the route in `src/Routes/reviewRouter.js`, protected by `restrictTo("vendor", "admin")` and validated via `replyOnReviewValidation`.

## 4. Moderation & Report Workflow Fixes
**Problem:** Report submissions had absolutely no Joi validation and lacked checks to verify if the reported user or content actually existed.
- **Modified APIs:** `POST /api/v1/reports/`
- **Fix:** 
  - Created a brand new `src/validations/reportValidation.js` module enforcing UUID constraints and `content_type` enums.
  - Attached it to the `reportRoutes.js` endpoints.
  - Refactored `createReportCore` in `src/services/Core/Client/reportCore.js` to explicitly query MongoDB for the `reported_user` and `content_id` (Packages/Reviews) prior to saving the report.

## 5. Vendor & Employee Approval Workflows
**Problem:** Vendor approval details retrieved by admins did not include `VendorVerification` documents, meaning admins couldn't actually review uploaded business licenses or ID cards.
- **Modified APIs:** `GET /api/v1/admin/vendor-approvals/:vendorId`
- **Fix:** Updated `getVendorDetailsCore` in `src/services/Core/Admin/vendorApprovalCore.js` to fetch the `VendorVerificationModel` associated with the vendor and return it alongside the vendor profile.

**Problem:** The Vendor and Employee (Staff) workflows lacked integration tests.
- **Solution:** 
  - Created `tests/workflows/vendorAndEmployeeApproval.test.js`.
  - Wrote and passed end-to-end testing pipelines covering:
    - Admin retrieving vendors, viewing verification files, and updating approval statuses.
    - Vendors adding staff members, fetching their employee list, updating employee details, and soft-deleting employees.
