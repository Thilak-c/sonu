import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
  },
});

/**
 * Send an email verification OTP code to the user
 */
export async function sendVerificationEmail({ to, name, code }) {
  const from = process.env.EMAIL_FROM || `"Sonu Shoes" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`;
  const displayCode = code || '123456';
  const greeting = name && name.trim() ? `Hello ${name.trim()},` : 'Hello,';

  const mailOptions = {
    from,
    to,
    subject: `Verify Your Email Address - Sonu Shoes`,
    html: `
      <div style="font-family: sans-serif; background-color: #141416; color: #ffffff; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #323236;">
        <h2 style="color: #ffffff; font-size: 24px; font-weight: 850; letter-spacing: -0.03em; margin: 0 0 24px 0;">Sonu Shoes</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #f4f5f8; margin: 0 0 16px 0;">${greeting}</p>
        <p style="font-size: 16px; line-height: 1.6; color: #f4f5f8; margin: 0 0 24px 0;">Thank you for registering at Sonu Shoes. Please use the verification code below to verify your email address and activate your account benefits:</p>
        <div style="margin: 32px 0;">
          <div style="background-color: #ffffff; color: #141416; text-decoration: none; padding: 14px 28px; font-weight: 800; border-radius: 8px; font-size: 26px; letter-spacing: 6px; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;">${displayCode}</div>
        </div>
        <p style="font-size: 13px; color: #9b9ba6; line-height: 1.5; margin: 32px 0 0 0;">If you did not request this verification, please ignore this email.</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}
