import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Approver } from '../models/Approver.js';
import { sendWhatsAppOTP } from '../services/twilioService.js';

export const requestOtp = async (req: Request, res: Response) => {
  const { phone } = req.body;

  const approver = await Approver.findOne({ phone, isActive: true });
  if (!approver) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  approver.otp = otp;
  approver.otpExpires = Date.now() + 5 * 60 * 1000;
  await approver.save();

  await sendWhatsAppOTP(approver.phone, otp);

  res.json({ message: 'OTP sent successfully' });
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { phone, otp } = req.body;

  const approver = await Approver.findOne({
    phone,
    otp,
    otpExpires: { $gt: Date.now() },
  });

  if (!approver) {
    return res.status(401).json({ message: 'Invalid or expired OTP' });
  }

  const token = jwt.sign(
    { id: approver._id, role: approver.role },
    process.env.JWT_SECRET!,
    { expiresIn: '1d' }
  );

  approver.otp = null;
  approver.otpExpires = null;
  await approver.save();

  res.json({ token });
};
