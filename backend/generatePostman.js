const fs = require('fs');

const collection = {
    info: {
        name: "Xenon Platform API",
        description: "Complete API Collection for Xenon Platform, separated by Roles.",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    variable: [
        { key: "baseUrl", value: "http://localhost:3000/api/v1", type: "string" },
        { key: "accessToken", value: "YOUR_ACCESS_TOKEN", type: "string" }
    ],
    item: [
        // ==========================================
        // 1. PUBLIC / SHARED
        // ==========================================
        {
            name: "1. Public & Auth",
            item: [
                {
                    name: "Auth - Register User/Vendor",
                    request: {
                        method: "POST",
                        header: [],
                        body: { mode: "raw", raw: JSON.stringify({ name: "Test User", email: "user@test.com", password: "Password123!", role: "user" }, null, 2), options: { raw: { language: "json" } } },
                        url: { raw: "{{baseUrl}}/auth/register", host: ["{{baseUrl}}"], path: ["auth", "register"] }
                    }
                },
                {
                    name: "Auth - Login",
                    request: {
                        method: "POST",
                        header: [],
                        body: { mode: "raw", raw: JSON.stringify({ email: "user@test.com", password: "Password123!" }, null, 2), options: { raw: { language: "json" } } },
                        url: { raw: "{{baseUrl}}/auth/login", host: ["{{baseUrl}}"], path: ["auth", "login"] }
                    }
                },
                {
                    name: "Auth - Refresh Token",
                    request: {
                        method: "POST",
                        header: [],
                        url: { raw: "{{baseUrl}}/auth/refresh-token", host: ["{{baseUrl}}"], path: ["auth", "refresh-token"] }
                    }
                },
                {
                    name: "Packages - Get All (Public)",
                    request: {
                        method: "GET",
                        header: [],
                        url: { raw: "{{baseUrl}}/packages", host: ["{{baseUrl}}"], path: ["packages"] }
                    }
                }
            ]
        },

        // ==========================================
        // 2. ADMIN ROLE
        // ==========================================
        {
            name: "2. Admin Role",
            item: [
                {
                    name: "Auth - Register Admin",
                    request: {
                        method: "POST",
                        header: [],
                        body: { mode: "raw", raw: JSON.stringify({ name: "Super Admin", email: "admin@xenon.com", password: "Password123!", adminCode: "SECRET_CODE" }, null, 2), options: { raw: { language: "json" } } },
                        url: { raw: "{{baseUrl}}/admin/auth/register", host: ["{{baseUrl}}"], path: ["admin", "auth", "register"] }
                    }
                },
                {
                    name: "Staff - Add Employee",
                    request: {
                        method: "POST",
                        header: [{ key: "Authorization", value: "Bearer {{accessToken}}" }],
                        body: { mode: "raw", raw: JSON.stringify({ name: "Staff Member", email: "staff@xenon.com", password: "Password123!", role: "admin", permissions: ["manage_users"] }, null, 2), options: { raw: { language: "json" } } },
                        url: { raw: "{{baseUrl}}/admin/staff", host: ["{{baseUrl}}"], path: ["admin", "staff"] }
                    }
                },
                {
                    name: "Moderation - Resolve Report",
                    request: {
                        method: "POST",
                        header: [{ key: "Authorization", value: "Bearer {{accessToken}}" }],
                        body: { mode: "raw", raw: JSON.stringify({ action: "warn_user" }, null, 2), options: { raw: { language: "json" } } },
                        url: { raw: "{{baseUrl}}/admin/reports/REPORT_ID/resolve", host: ["{{baseUrl}}"], path: ["admin", "reports", "REPORT_ID", "resolve"] }
                    }
                },
                {
                    name: "Vendor Approvals - Update Status",
                    request: {
                        method: "PATCH",
                        header: [{ key: "Authorization", value: "Bearer {{accessToken}}" }],
                        body: { mode: "raw", raw: JSON.stringify({ status: "approved" }, null, 2), options: { raw: { language: "json" } } },
                        url: { raw: "{{baseUrl}}/admin/vendor-approvals/VENDOR_ID/status", host: ["{{baseUrl}}"], path: ["admin", "vendor-approvals", "VENDOR_ID", "status"] }
                    }
                }
            ]
        },

        // ==========================================
        // 3. VENDOR ROLE
        // ==========================================
        {
            name: "3. Vendor Role",
            item: [
                {
                    name: "Packages - Create Package",
                    request: {
                        method: "POST",
                        header: [{ key: "Authorization", value: "Bearer {{accessToken}}" }],
                        body: { mode: "raw", raw: JSON.stringify({ package_name: "Dubai Tour", price: 500, description: "Awesome tour" }, null, 2), options: { raw: { language: "json" } } },
                        url: { raw: "{{baseUrl}}/packages", host: ["{{baseUrl}}"], path: ["packages"] }
                    }
                },
                {
                    name: "Complaints - Vendor Reply",
                    request: {
                        method: "POST",
                        header: [{ key: "Authorization", value: "Bearer {{accessToken}}" }],
                        body: { mode: "raw", raw: JSON.stringify({ reply: "We apologize for the inconvenience." }, null, 2), options: { raw: { language: "json" } } },
                        url: { raw: "{{baseUrl}}/complaints/VENDOR_COMPLAINT_ID/reply", host: ["{{baseUrl}}"], path: ["complaints", "VENDOR_COMPLAINT_ID", "reply"] }
                    }
                }
            ]
        },

        // ==========================================
        // 4. USER ROLE (CLIENT)
        // ==========================================
        {
            name: "4. User Role (Client)",
            item: [
                {
                    name: "Bookings - Create Booking",
                    request: {
                        method: "POST",
                        header: [{ key: "Authorization", value: "Bearer {{accessToken}}" }],
                        body: { mode: "raw", raw: JSON.stringify({ package_id: "PKG_ID", date: "2026-10-10" }, null, 2), options: { raw: { language: "json" } } },
                        url: { raw: "{{baseUrl}}/bookings", host: ["{{baseUrl}}"], path: ["bookings"] }
                    }
                },
                {
                    name: "Complaints - Submit",
                    request: {
                        method: "POST",
                        header: [{ key: "Authorization", value: "Bearer {{accessToken}}" }],
                        body: { mode: "raw", raw: JSON.stringify({ complaint_type: "Service", complaint_title: "Bad service", complaint_message: "The tour was bad", complaint_priority: "medium", booking_id: "BOOKING_ID" }, null, 2), options: { raw: { language: "json" } } },
                        url: { raw: "{{baseUrl}}/complaints", host: ["{{baseUrl}}"], path: ["complaints"] }
                    }
                },
                {
                    name: "Reports - Submit",
                    request: {
                        method: "POST",
                        header: [{ key: "Authorization", value: "Bearer {{accessToken}}" }],
                        body: { mode: "raw", raw: JSON.stringify({ reported_user: "USER_ID", content_type: "Review", content_id: "REVIEW_ID", reason: "spam", description: "Spam comment" }, null, 2), options: { raw: { language: "json" } } },
                        url: { raw: "{{baseUrl}}/reports", host: ["{{baseUrl}}"], path: ["reports"] }
                    }
                },
                {
                    name: "AI Advisor - Chat",
                    request: {
                        method: "POST",
                        header: [{ key: "Authorization", value: "Bearer {{accessToken}}" }],
                        body: { mode: "raw", raw: JSON.stringify({ query: "I want to visit Paris, any tips?" }, null, 2), options: { raw: { language: "json" } } },
                        url: { raw: "{{baseUrl}}/ai/chat", host: ["{{baseUrl}}"], path: ["ai", "chat"] }
                    }
                },
                {
                    name: "Notifications - Get My Notifications",
                    request: {
                        method: "GET",
                        header: [{ key: "Authorization", value: "Bearer {{accessToken}}" }],
                        url: { raw: "{{baseUrl}}/notifications", host: ["{{baseUrl}}"], path: ["notifications"] }
                    }
                }
            ]
        }
    ]
};

fs.writeFileSync('Xenon_Postman_Collection.json', JSON.stringify(collection, null, 2));
console.log('Postman collection generated successfully.');
