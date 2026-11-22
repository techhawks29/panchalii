const crypto = require('crypto');
const Otp = require('../models/otp.model');

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

const createOtp = async (identifier, type) => {
  await Otp.deleteMany({ identifier, type });
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await Otp.create({ identifier, otp, type, expiresAt });
  return otp;
};

const verifyOtp = async (identifier, otp, type) => {
  const record = await Otp.findOne({ identifier, type });
  if (!record) return false;
  if (record.expiresAt < new Date()) {
    await record.deleteOne();
    return false;
  }
  if (record.otp !== otp) return false;
  await record.deleteOne();
  return true;
};

const discardOtp = (identifier, type) => Otp.deleteMany({ identifier, type });

module.exports = { createOtp, verifyOtp, discardOtp };
