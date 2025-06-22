const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify transporter
transporter.verify()
  .then(() => logger.info('SMTP connection established successfully'))
  .catch(error => logger.error('SMTP connection error:', error));

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content
 * @returns {Promise<Object>} Nodemailer response
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: `${process.env.APP_NAME} <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send a welcome email
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 */
const sendWelcomeEmail = async (to, name) => {
  const subject = `Welcome to ${process.env.APP_NAME}!`;
  const text = `Hi ${name},\n\nWelcome to ${process.env.APP_NAME}! We're excited to have you on board.\n\nBest regards,\nThe ${process.env.APP_NAME} Team`;
  const html = `
    <h2>Welcome to ${process.env.APP_NAME}!</h2>
    <p>Hi ${name},</p>
    <p>We're excited to have you on board.</p>
    <br>
    <p>Best regards,</p>
    <p>The ${process.env.APP_NAME} Team</p>
  `;

  return sendEmail({ to, subject, text, html });
};

/**
 * Send a password reset email
 * @param {string} to - Recipient email
 * @param {string} resetToken - Password reset token
 */
const sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const subject = 'Password Reset Request';
  const text = `You requested a password reset. Please click on the following link to reset your password: ${resetUrl}\n\nIf you didn't request this, please ignore this email.`;
  const html = `
    <h2>Password Reset Request</h2>
    <p>You requested a password reset. Please click on the following link to reset your password:</p>
    <p><a href="${resetUrl}">Reset Password</a></p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  return sendEmail({ to, subject, text, html });
};

/**
 * Send a booking confirmation email
 * @param {string} to - Recipient email
 * @param {Object} booking - Booking details
 */
const sendBookingConfirmationEmail = async (to, booking) => {
  const subject = 'Booking Confirmation';
  const text = `Your booking has been confirmed!\n\nBooking Details:\nDate: ${booking.date}\nTime: ${booking.time}\nVenue: ${booking.venue}\n\nThank you for choosing our service.`;
  const html = `
    <h2>Booking Confirmation</h2>
    <p>Your booking has been confirmed!</p>
    <h3>Booking Details:</h3>
    <ul>
      <li>Date: ${booking.date}</li>
      <li>Time: ${booking.time}</li>
      <li>Venue: ${booking.venue}</li>
    </ul>
    <p>Thank you for choosing our service.</p>
  `;

  return sendEmail({ to, subject, text, html });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBookingConfirmationEmail
}; 