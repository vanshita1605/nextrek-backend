const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, text) => {
  try {
    const msg = {
      to: to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: subject,
      text: text,
    };

    await sgMail.send(msg);
    console.log("Email sent successfully");
  } catch (error) {
    console.log("Email error:", error);
  }
};

module.exports = sendEmail;