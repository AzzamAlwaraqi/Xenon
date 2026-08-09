'use strict';

const nodemailer = require('nodemailer');

// ─── Env Value Sanitizer ──────────────────────────────────────────────────────
// dotenv and wrappers like dotenvx can inject values WITH surrounding quotes
// (e.g. "smtp.gmail.com" as a string literal). This helper strips them safely.
function env(key, fallback = '') {
    let val = process.env[key] || fallback;
    // Strip surrounding double-quotes or single-quotes
    if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
    ) {
        val = val.slice(1, -1);
    }
    return val.trim();
}

// ─── Configuration ────────────────────────────────────────────────────────────
function buildSmtpConfig() {
    return {
        host:   env('SMTP_HOST', 'smtp.gmail.com'),
        port:   Number(env('SMTP_PORT', '465')),
        secure: env('SMTP_SECURE', 'true') === 'true', // true = SSL/port 465
        auth: {
            user: env('GOOGLE_EMAIL_ADDRESS'),
            pass: env('GOOGLE_EMAIL_APP_PASSWORD_SMTP'),
        },
        connectionTimeout: 10_000, // 10s to establish TCP connection
        greetingTimeout:    8_000, // 8s to receive SMTP greeting
        socketTimeout:     15_000, // 15s of socket inactivity
    };
}

// ─── Required env vars ────────────────────────────────────────────────────────
const REQUIRED_VARS = [
    'GOOGLE_EMAIL_ADDRESS',
    'GOOGLE_EMAIL_APP_PASSWORD_SMTP',
    'SMTP_HOST',
];

function validateEnv() {
    const missing = REQUIRED_VARS.filter(k => !env(k));
    if (missing.length) {
        console.error(`❌ Email service misconfigured — missing: ${missing.join(', ')}`);
        return false;
    }
    return true;
}

// ─── Lazy Transporter ─────────────────────────────────────────────────────────
// Built on first use so env vars are guaranteed loaded by the time we need them.
let _transporter = null;

function getTransporter() {
    if (!_transporter) {
        _transporter = nodemailer.createTransport(buildSmtpConfig());
    }
    return _transporter;
}

function resetTransporter() {
    _transporter = null;
}

// ─── Startup Health-Check ─────────────────────────────────────────────────────
async function verifyConnection() {
    if (!validateEnv()) return false;
    try {
        await getTransporter().verify();
        console.log(`✅ SMTP connected — ${env('SMTP_HOST')}:${env('SMTP_PORT')} ready.`);
        return true;
    } catch (err) {
        console.error('❌ SMTP connection failed:', _smtpHint(err));
        resetTransporter(); // Force fresh transporter on next attempt
        return false;
    }
}

// ─── sendEmail ────────────────────────────────────────────────────────────────
/**
 * Send a transactional email with automatic retry on transient failures.
 *
 * @param {object} options
 * @param {string} options.to       - Recipient address
 * @param {string} options.subject  - Email subject line
 * @param {string} options.text     - Plain-text fallback body
 * @param {string} [options.html]   - HTML body (falls back to <p>text</p>)
 * @param {number} [options.retries=2] - Max retries on transient SMTP errors
 * @returns {Promise<object>} Nodemailer info object
 */
async function sendEmail({ to, subject, text, html, retries = 2 }) {
    if (!validateEnv()) {
        throw new Error('Email service is not configured — check SMTP environment variables.');
    }
    if (!to || !subject || !text) {
        throw new Error('sendEmail requires: to, subject, text');
    }

    const mailOptions = {
        from: `"${env('GOOGLE_EMAIL_APP_SMTP', 'Xenon')}" <${env('GOOGLE_EMAIL_ADDRESS')}>`,
        to,
        subject,
        text,
        html: html || `<p>${text}</p>`,
    };

    let lastError;
    const maxAttempts = retries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const info = await getTransporter().sendMail(mailOptions);
            console.log(`✉️  Email → ${to} | ID: ${info.messageId} | Attempt: ${attempt}`);
            return info;
        } catch (err) {
            lastError = err;
            const transient = _isTransient(err);

            console.warn(
                `⚠️  Email attempt ${attempt}/${maxAttempts} failed [${err.code || err.responseCode}]: ${err.message}` +
                (transient && attempt < maxAttempts ? ' — retrying…' : '')
            );

            if (!transient || attempt >= maxAttempts) break;

            // Reset transporter on connection-level errors so next attempt gets a fresh socket
            if (_isConnectionError(err)) resetTransporter();

            // Exponential back-off: 1s → 2s → 4s
            await _sleep(1000 * Math.pow(2, attempt - 1));
        }
    }

    console.error(`❌ Email permanently failed for ${to}:`, lastError.message);
    throw lastError;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────
function _isTransient(err) {
    const transientCodes  = ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ESOCKET', 'ENOTFOUND'];
    const transientSmtp   = [421, 450, 451, 452]; // 4xx = transient SMTP
    return transientCodes.includes(err.code) || transientSmtp.includes(err.responseCode);
}

function _isConnectionError(err) {
    return ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ESOCKET'].includes(err.code);
}

function _smtpHint(err) {
    const cfg = buildSmtpConfig();
    const hints = {
        EAUTH:        'Auth failed — check GOOGLE_EMAIL_ADDRESS & GOOGLE_EMAIL_APP_PASSWORD_SMTP. Gmail requires an App Password, not your account password.',
        ECONNREFUSED: `Connection refused on ${cfg.host}:${cfg.port} — check SMTP_HOST / SMTP_PORT.`,
        ENOTFOUND:    `Host "${cfg.host}" not found — check SMTP_HOST and network/DNS.`,
        ETIMEDOUT:    `Timeout on ${cfg.host}:${cfg.port} — port may be blocked by firewall. Try port 465 with SMTP_SECURE=true.`,
    };
    return hints[err.code] || err.message;
}

function _sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

module.exports = { sendEmail, verifyConnection };