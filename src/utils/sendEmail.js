const { sendEmail } = require("./email");

// OTP email
const sendOTPEmail = async (to, otp) => {
  const subject = "Verify your email - Nextrek";

  const text = `
Your OTP for Nextrek verification is: ${otp}

This OTP will expire in 10 minutes.

If you did not request this, please ignore this email.
`;

  await sendEmail(to, subject, text);
};

// Welcome email
const sendWelcomeEmail = async (to, name) => {
  const subject = "Welcome to Nextrek 🎉";

  const text = `
Hi ${name},

Your email has been verified successfully.

Welcome to Nextrek 🚀
`;

  await sendEmail(to, subject, text);
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
};