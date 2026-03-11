// src/utils/otp.js

// Generate a six digit numeric OTP string with leading zeros allowed
function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

module.exports = {
  generateOTP,
};
