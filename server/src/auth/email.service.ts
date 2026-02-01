import nodemailer from 'nodemailer';
import { config } from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  ...(config.smtp.user && config.smtp.pass
    ? { auth: { user: config.smtp.user, pass: config.smtp.pass } }
    : {}),
});

export async function sendVerificationCode(email: string, code: string): Promise<void> {
  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'QuizApp - Email Verification Code',
    text: `Your verification code is: ${code}\n\nThis code expires in ${config.verificationCodeExpiryMinutes} minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #4f46e5; margin-bottom: 16px;">QuizApp</h2>
        <p>Your verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; background: #f3f4f6; border-radius: 8px; margin: 16px 0;">
          ${code}
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code expires in ${config.verificationCodeExpiryMinutes} minutes.</p>
      </div>
    `,
  });
}
