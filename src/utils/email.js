// src/utils/email.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"NexTrek" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

const sendWelcomeEmail = (email, name) => {
  const html = `
    <h2>Welcome to Travel Planner, ${name}!</h2>
    <p>We're excited to have you on board.</p>
    <p>Start planning your next trip today!</p>
  `;
  return sendEmail(email, 'Welcome to Travel Planner', html);
};

const sendPasswordResetEmail = (email, resetLink) => {
  const html = `
    <h2>Password Reset Request</h2>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
  `;
  return sendEmail(email, 'Password Reset', html);
};

const sendTripInvitationEmail = (email, tripName, joinLink) => {
  const html = `
    <h2>You're invited to join a trip!</h2>
    <p>You've been invited to join the trip: <strong>${tripName}</strong></p>
    <a href="${joinLink}">Accept Invitation</a>
  `;
  return sendEmail(email, `Trip Invitation - ${tripName}`, html);
};

const sendOTPEmail = (email, otp) => {
  const html = `
    <h2>Email Verification Code</h2>
    <p>Your verification code is <strong>${otp}</strong>.</p>
    <p>This code will expire in 10 minutes.</p>
  `;
  return sendEmail(email, 'Email Verification OTP', html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTripInvitationEmail,
  sendOTPEmail,
};
