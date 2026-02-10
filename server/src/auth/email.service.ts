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
    subject: 'QuizBonk - Email Verification Code',
    text: `Your verification code is: ${code}\n\nThis code expires in ${config.verificationCodeExpiryMinutes} minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #4f46e5; margin-bottom: 16px;">QuizBonk</h2>
        <p>Your verification code is:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; background: #f3f4f6; border-radius: 8px; margin: 16px 0;">
          ${code}
        </div>
        <p style="color: #6b7280; font-size: 14px;">This code expires in ${config.verificationCodeExpiryMinutes} minutes.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, tempPassword: string): Promise<void> {
  await transporter.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'QuizBonk - Password Reset',
    text: `Your password has been reset by an administrator.\n\nYour new temporary password is: ${tempPassword}\n\nPlease log in and change your password as soon as possible.`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #4f46e5; margin-bottom: 16px;">QuizBonk</h2>
        <p>Your password has been reset by an administrator.</p>
        <p>Your new temporary password is:</p>
        <div style="font-size: 18px; font-weight: bold; text-align: center; padding: 16px; background: #f3f4f6; border-radius: 8px; margin: 16px 0; font-family: monospace;">
          ${tempPassword}
        </div>
        <p style="color: #6b7280; font-size: 14px;">Please log in and change your password as soon as possible.</p>
      </div>
    `,
  });
}
