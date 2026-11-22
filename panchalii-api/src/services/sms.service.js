const config = require('../config/config');

let twilioClient = null;

const getClient = () => {
  if (!twilioClient && config.twilio.accountSid && config.twilio.authToken) {
    const twilio = require('twilio');
    twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
  }
  return twilioClient;
};

const sendOtp = async (phone, otp) => {
  const client = getClient();
  if (!client) {
    // A silent stub in production would make callers think the code was delivered
    if (config.env === 'production') throw new Error('SMS delivery is not configured (TWILIO_*)');
    console.info(`[SMS stub] OTP ${otp} for ${phone}`);
    return;
  }
  await client.messages.create({
    body: `Your Panchalii OTP is ${otp}. Valid for 10 minutes. Do not share with anyone.`,
    from: config.twilio.phoneNumber,
    to: phone,
  });
};

module.exports = { sendOtp };
