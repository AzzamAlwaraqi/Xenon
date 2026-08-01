const nodemailer = require("nodemailer");
const AppError = require("../../utils/AppError");

/**
 * Send an email
 * @param {Object} options
 * @param {string} options.email - recipient email address
 * @param {string} options.subject - email subject
 * @param {string} options.message - plain text body
 * @param {string} [options.html] - HTML body
 */
const sendEmail = async (options) => {
    try {
        // Fallback to console log if SMTP host/user is not configured
        if (!process.env.EMAIL_HOST || !process.env.EMAIL_USERNAME) {
            console.log("-----------------------------------------");
            console.log(`[Email Service (FALLBACK MOCK)]`);
            console.log(`To: ${options.email}`);
            console.log(`Subject: ${options.subject}`);
            console.log(`Body: ${options.message}`);
            console.log("-----------------------------------------");
            return { success: true, message: "Email logged to console (no credentials configured)" };
        }

        // 1) Create a transporter
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT, 10) || 2525,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // 2) Define the email options
        const mailOptions = {
            from: `Xenon <${process.env.EMAIL_FROM || "no-reply@xenon.com"}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html
        };

        // 3) Actually send the email
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        throw new AppError("Failed to send email. Please try again later.", 500);
    }
};

module.exports = { sendEmail };
