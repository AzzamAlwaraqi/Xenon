const fs = require('fs');

const collection = {
  "info": {
    "_postman_id": "c4639e4a-9b48-43ec-95d8-04d3e52fdb0b",
    "name": "Xenon",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:3000/api/v1", "type": "string" },
    { "key": "accessToken", "value": "YOUR_ACCESS_TOKEN", "type": "string" }
  ],
  "item": [
    // ==========================================
    // VENDOR ROLE
    // ==========================================
    {
      "name": "vendor",
      "item": [
        {
          "name": "Vendor Account",
          "item": [
            { "name": "Register Vendor", "request": { "method": "POST", "url": "{{baseUrl}}/auth/register", "body": { "mode": "raw", "raw": "{\n  \"name\": \"Vendor Name\",\n  \"email\": \"vendor@test.com\",\n  \"password\": \"Password123!\",\n  \"role\": \"vendor\"\n}", "options": { "raw": { "language": "json" } } } } },
            { "name": "Login Vendor", "request": { "method": "POST", "url": "{{baseUrl}}/auth/login", "body": { "mode": "raw", "raw": "{\n  \"email\": \"vendor@test.com\",\n  \"password\": \"Password123!\"\n}", "options": { "raw": { "language": "json" } } } } },
            { "name": "Refresh Token", "request": { "method": "POST", "url": "{{baseUrl}}/auth/refresh-token" } },
            { "name": "Logout", "request": { "method": "POST", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/auth/logout" } }
          ]
        },
        {
          "name": "Vendor Profile",
          "item": [
            { "name": "Get Vendor Profile", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/profile" } },
            { "name": "Update Vendor Profile", "request": { "method": "PATCH", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/profile", "body": { "mode": "raw", "raw": "{\n  \"name\": \"Updated Vendor Name\",\n  \"phone\": \"0123456789\"\n}", "options": { "raw": { "language": "json" } } } } }
          ]
        },
        {
          "name": "Packages CRUD",
          "item": [
            { "name": "Create Package", "request": { "method": "POST", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/packages", "body": { "mode": "raw", "raw": "{\n  \"package_name\": \"Dubai Safari Tour\",\n  \"price\": 500,\n  \"description\": \"An amazing safari experience in Dubai.\"\n}", "options": { "raw": { "language": "json" } } } } },
            { "name": "Get Vendor Packages", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/packages" } },
            { "name": "Get Package by ID", "request": { "method": "GET", "url": "{{baseUrl}}/packages/PACKAGE_ID" } },
            { "name": "Update Package", "request": { "method": "PATCH", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/packages/PACKAGE_ID", "body": { "mode": "raw", "raw": "{\n  \"price\": 450\n}", "options": { "raw": { "language": "json" } } } } },
            { "name": "Delete Package", "request": { "method": "DELETE", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/packages/PACKAGE_ID" } }
          ]
        },
        {
          "name": "Booking",
          "item": [
            { "name": "Get Vendor Bookings", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/bookings" } },
            { "name": "Accept Booking", "request": { "method": "PATCH", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/bookings/BOOKING_ID/status", "body": { "mode": "raw", "raw": "{\n  \"status\": \"confirmed\"\n}", "options": { "raw": { "language": "json" } } } } }
          ]
        },
        {
          "name": "review and complaint",
          "item": [
            { "name": "Get Complaints against me", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/complaints" } },
            { "name": "Reply to Complaint", "request": { "method": "POST", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/complaints/ID/reply", "body": { "mode": "raw", "raw": "{\n  \"reply\": \"We apologize for the inconvenience.\"\n}", "options": { "raw": { "language": "json" } } } } },
            { "name": "Get My Reviews", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/reviews" } }
          ]
        },
        {
          "name": "notification",
          "item": [
            { "name": "Get Notifications", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/notifications" } }
          ]
        },
        {
          "name": "analysis",
          "item": [
            { "name": "Get Vendor Analytics", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/vendors/analytics" } }
          ]
        }
      ]
    },
    // ==========================================
    // CLIENT ROLE
    // ==========================================
    {
      "name": "client",
      "item": [
        {
          "name": "Client Account",
          "item": [
            { "name": "Register Client", "request": { "method": "POST", "url": "{{baseUrl}}/auth/register", "body": { "mode": "raw", "raw": "{\n  \"name\": \"Client Name\",\n  \"email\": \"client@test.com\",\n  \"password\": \"Password123!\",\n  \"role\": \"user\"\n}", "options": { "raw": { "language": "json" } } } } },
            { "name": "Login Client", "request": { "method": "POST", "url": "{{baseUrl}}/auth/login", "body": { "mode": "raw", "raw": "{\n  \"email\": \"client@test.com\",\n  \"password\": \"Password123!\"\n}", "options": { "raw": { "language": "json" } } } } },
            { "name": "Send OTP", "request": { "method": "POST", "url": "{{baseUrl}}/auth/send-otp", "body": { "mode": "raw", "raw": "{\n  \"email\": \"client@test.com\"\n}", "options": { "raw": { "language": "json" } } } } },
            { "name": "Verify OTP", "request": { "method": "POST", "url": "{{baseUrl}}/auth/verify-otp", "body": { "mode": "raw", "raw": "{\n  \"email\": \"client@test.com\",\n  \"otp\": \"123456\"\n}", "options": { "raw": { "language": "json" } } } } }
          ]
        },
        {
          "name": "Client Profile",
          "item": [
            { "name": "Get Client Profile", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/profile" } },
            { "name": "Update Client Profile", "request": { "method": "PATCH", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/profile", "body": { "mode": "raw", "raw": "{\n  \"name\": \"Updated Client Name\"\n}", "options": { "raw": { "language": "json" } } } } }
          ]
        },
        {
          "name": "Booking",
          "item": [
            { "name": "Get All Packages (Public)", "request": { "method": "GET", "url": "{{baseUrl}}/packages" } },
            { "name": "Create Booking", "request": { "method": "POST", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/bookings", "body": { "mode": "raw", "raw": "{\n  \"package_id\": \"PACKAGE_ID\",\n  \"date\": \"2026-10-10\",\n  \"guests\": 2\n}", "options": { "raw": { "language": "json" } } } } },
            { "name": "Get My Bookings", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/bookings" } },
            { "name": "Cancel Booking", "request": { "method": "PATCH", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/bookings/BOOKING_ID/cancel" } }
          ]
        },
        {
          "name": "review and complaint",
          "item": [
            { "name": "Submit Complaint", "request": { "method": "POST", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/complaints", "body": { "mode": "raw", "raw": "{\n  \"complaint_type\": \"Service\",\n  \"complaint_title\": \"Bad Tour\",\n  \"complaint_message\": \"The tour was delayed\",\n  \"complaint_priority\": \"high\",\n  \"booking_id\": \"BOOKING_ID\"\n}", "options": { "raw": { "language": "json" } } } } },
            { "name": "Get My Complaints", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/complaints" } },
            { "name": "Submit Report", "request": { "method": "POST", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/reports", "body": { "mode": "raw", "raw": "{\n  \"reported_user\": \"VENDOR_USER_ID\",\n  \"content_type\": \"Package\",\n  \"content_id\": \"PACKAGE_ID\",\n  \"reason\": \"scam\",\n  \"description\": \"Fake package\"\n}", "options": { "raw": { "language": "json" } } } } },
            { "name": "Add Review", "request": { "method": "POST", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/reviews", "body": { "mode": "raw", "raw": "{\n  \"package_id\": \"PACKAGE_ID\",\n  \"rating\": 5,\n  \"comment\": \"Amazing!\"\n}", "options": { "raw": { "language": "json" } } } } }
          ]
        },
        {
          "name": "notification",
          "item": [
            { "name": "Get My Notifications", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/notifications" } }
          ]
        },
        {
          "name": "AI Advisor",
          "item": [
            { "name": "Chat with AI Advisor", "request": { "method": "POST", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/ai/chat", "body": { "mode": "raw", "raw": "{\n  \"query\": \"Give me tips for visiting Dubai\"\n}", "options": { "raw": { "language": "json" } } } } }
          ]
        }
      ]
    },
    // ==========================================
    // ADMIN ROLE
    // ==========================================
    {
      "name": "Admin",
      "item": [
        {
          "name": "Admin Account",
          "item": [
            { "name": "Register Admin", "request": { "method": "POST", "url": "{{baseUrl}}/admin/auth/register", "body": { "mode": "raw", "raw": "{\n  \"name\": \"Super Admin\",\n  \"email\": \"admin@xenon.com\",\n  \"password\": \"Password123!\",\n  \"adminCode\": \"SECRET_CODE\"\n}", "options": { "raw": { "language": "json" } } } } },
            { "name": "Login Admin", "request": { "method": "POST", "url": "{{baseUrl}}/auth/login", "body": { "mode": "raw", "raw": "{\n  \"email\": \"admin@xenon.com\",\n  \"password\": \"Password123!\"\n}", "options": { "raw": { "language": "json" } } } } }
          ]
        },
        {
          "name": "Admin Profile",
          "item": [
            { "name": "Get Admin Profile", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/profile" } }
          ]
        },
        {
          "name": "review and complaint",
          "item": [
            { "name": "Get All Complaints", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/complaints" } },
            { "name": "Respond to Complaint", "request": { "method": "PATCH", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/complaints/COMPLAINT_ID/respond", "body": { "mode": "raw", "raw": "{\n  \"status\": \"resolved\",\n  \"admin_response\": \"Issue has been resolved.\"\n}", "options": { "raw": { "language": "json" } } } } }
          ]
        },
        {
          "name": "staff",
          "item": [
            { "name": "Get All Staff", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/admin/staff" } },
            { "name": "Add Employee", "request": { "method": "POST", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/admin/staff", "body": { "mode": "raw", "raw": "{\n  \"name\": \"Staff Name\",\n  \"email\": \"staff@xenon.com\",\n  \"password\": \"Password123!\",\n  \"role\": \"admin\",\n  \"permissions\": [\"manage_users\"]\n}", "options": { "raw": { "language": "json" } } } } },
            { "name": "Update Employee", "request": { "method": "PATCH", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/admin/staff/STAFF_ID", "body": { "mode": "raw", "raw": "{\n  \"permissions\": [\"manage_users\", \"manage_reports\"]\n}", "options": { "raw": { "language": "json" } } } } },
            { "name": "Delete Employee", "request": { "method": "DELETE", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/admin/staff/STAFF_ID" } }
          ]
        },
        {
          "name": "moderation",
          "item": [
            { "name": "Get All Reports", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/admin/reports" } },
            { "name": "Resolve Report", "request": { "method": "POST", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/admin/reports/REPORT_ID/resolve", "body": { "mode": "raw", "raw": "{\n  \"action\": \"warn_user\"\n}", "options": { "raw": { "language": "json" } } } } },
            { "name": "Escalate Report", "request": { "method": "POST", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/admin/reports/REPORT_ID/escalate", "body": { "mode": "raw", "raw": "{\n  \"escalationNotes\": \"This needs senior review\"\n}", "options": { "raw": { "language": "json" } } } } },
            { "name": "Get User Moderation History", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/admin/users/USER_ID/moderation-history" } }
          ]
        },
        {
          "name": "vendorApproval",
          "item": [
            { "name": "Get Vendors", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/admin/vendor-approvals" } },
            { "name": "Get Vendor Details", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/admin/vendor-approvals/VENDOR_ID" } },
            { "name": "Update Vendor Status", "request": { "method": "PATCH", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/admin/vendor-approvals/VENDOR_ID/status", "body": { "mode": "raw", "raw": "{\n  \"status\": \"approved\"\n}", "options": { "raw": { "language": "json" } } } } }
          ]
        },
        {
          "name": "notification",
          "item": [
            { "name": "Get Notifications", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/notifications" } }
          ]
        },
        {
          "name": "analysis",
          "item": [
            { "name": "Get Admin Dashboard Analytics", "request": { "method": "GET", "header": [{ "key": "Authorization", "value": "Bearer {{accessToken}}" }], "url": "{{baseUrl}}/admin/analytics" } }
          ]
        }
      ]
    }
  ]
};

fs.writeFileSync('Xenon_Postman_Collection.json', JSON.stringify(collection, null, 2));
console.log('Postman collection populated successfully with new structure.');
