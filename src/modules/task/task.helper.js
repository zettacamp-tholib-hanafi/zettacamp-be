// *************** IMPORT MODULE ***************
const sgMail = require("@sendgrid/mail");

// *************** INIT SENDGRID ***************
const { SENDGRID_API_KEY } = require("../../core/config");

sgMail.setApiKey(SENDGRID_API_KEY);

/**
 * Sends an email via SendGrid.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML body
 * @param {string} [options.from] - Sender email (defaults to no-reply)
 * @returns {Promise<void>}
 */
async function SendEmailViaSendGrid({
  to,
  subject,
  html,
  from = "tholib.hanafi@zettacamp.pro",
}) {
  try {
    const msg = { to, from, subject, html };
    const sendMail = await sgMail.send(msg);
    return sendMail;
  } catch (error) {
    console.error("SendGrid Error:", error.response?.body || error.message);
    throw new Error("Failed to send email notification");
  }
}

module.exports = {
  SendEmailViaSendGrid,
};
