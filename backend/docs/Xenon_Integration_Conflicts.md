**XENON**

**API & Frontend Conflict Register**

Vendor and Admin web portal  |  Working summary  |  28 August 2026

| Purpose. Record where Postman, the latest backend, and the React frontend disagreed; document the chosen handling; and identify work that remains with the backend team. |
| :---- |

# **Decision rule used**

Postman remained the functional reference. When Postman and backend behavior conflicted, implementation paused for a decision. Frontend-only compatibility was used when it did not change backend data or weaken security.

# **Conflict summary**

| Area | Conflict | Decision / handling | Status |
| :---- | :---- | :---- | :---- |
| **Registration role** | Postman implied direct vendor creation; backend forces every new registration to user. | Option 2 selected: create a user, then submit /profile/vendor-request. | **Resolved in frontend** |
| **Registration response** | Frontend expected data.token/newVendor; backend returns data.accessToken/user and currently references undefined newVendor. | Read accessToken. On 409/500 after registration, attempt safe user login recovery. | **Backend defect remains** |
| **OTP** | Vendor Postman request omitted OTP; backend registration requires and verifies it. | Kept send-OTP and six-digit OTP in registration, as explicitly requested. | **Resolved in frontend** |
| **Onboarding fields** | Postman lists company, address, city and documents; backend also requires state, pincode, country, vendor\_type and iban\_number. | Use the backend-required superset so applications do not fail with HTTP 400\. | **Temporary compatibility** |
| **Country** | Postman does not show country; backend requires it. Current launch scope is Jordan. | Country input removed; frontend silently submits country=Jordan. | **Temporary compatibility** |
| **Documents** | Backend requires four images and optionally accepts tourism licence; Postman displays all five. | Require commercial registration, vocational licence, owner ID and IBAN letter; tourism licence remains optional. Validate image type and 5 MB limit. | **Resolved in frontend** |
| **Admin profile** | Admin Postman profile payload appeared copied from vendor fields; backend permits only name, email and mobileNumber for admins. | Backend-supported admin identity fields were chosen after confirmation. | **Resolved in frontend** |
| **Review replies** | Vendor can read individual reviews, but no backend reply router/controller exists. | Reply UI is prepared with a provisional endpoint; live submission must wait for backend route. | **Not resolved** |
| **Complaint replies** | Vendor reply and admin response paths/methods differ between Postman and available backend routes. | UI and API adapters use documented/working paths where available; missing vendor route remains blocked. | **Partially resolved** |
| **Reports** | The moderation delete\_content action has a backend field/mapping problem. | Admin report UI remains ready, but the defective backend action is not simulated or hidden as success. | **Not resolved** |
| **Notifications** | Notification/Firebase contracts are incomplete or inconsistent for the web portal. | Vendor and Admin notification integration was deliberately deferred. | **Deferred** |
| **Payments** | CliQ receipt upload is not supported by the confirmed API contract. | CliQ upload UI was hidden; supported manual/online payment and statement actions remain. | **Resolved in frontend** |
| **Analytics** | Earlier frontend paths did not consistently use the backend /analysis prefix. | Vendor/Admin dashboard and package analytics calls were aligned to /analysis. | **Resolved in frontend** |
| **Staff** | Vendor employees and platform/admin employees were mixed conceptually; free-text positions caused typo risk. | Separated role contexts and replaced position text with controlled role-specific choices. | **Resolved in frontend** |
| **Sessions/login** | Role/token response differences and simultaneous-session collisions could return users to login. | Use access/refresh tokens, role-aware guards, targeted retry, and avoid clearing sessions for unrelated 401/403 errors. | **Resolved in frontend** |

# **Still requiring backend attention**

* **Registration response bug:** Remove or define newVendor in createAccountCore. The current error may occur after the user and session have already been written.  
* **Vendor approval lifecycle:** Confirm how an approved user becomes role=vendor, how tokens are refreshed after approval, and what rejected applicants should see when reapplying.  
* **Review and complaint reply routes:** Add and document the vendor reply endpoints, authorization, payload fields, response shape and status codes.  
* **Moderation delete\_content:** Correct the backend action mapping and return a stable moderation result.  
* **Notifications/Firebase:** Finalize web notification endpoints, FCM registration behavior, audience rules and response contracts before enabling these pages.  
* **Postman synchronization:** Update the collection so required onboarding fields and current HTTP methods match the deployed backend.

# **Current frontend verification**

After the latest Vendor Registration and Admin Profile/Settings changes: 17 automated tests pass, ESLint passes, and the Vite production build succeeds. These checks validate frontend behavior and compilation; they do not prove that unresolved backend routes work in production.