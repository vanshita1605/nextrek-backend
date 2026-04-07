require('dotenv').config();
const { sendOTPEmail } = require('./src/utils/email');

async function testEmail() {
  const result = await sendOTPEmail('your-email@example.com', '123456');
  console.log('Email sent:', result);
}

testEmail();