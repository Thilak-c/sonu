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
 * Send an email verification code / link to the user
 */
export async function sendVerificationEmail({ to, name, code }) {
  const from = process.env.EMAIL_FROM || 'Sonu Shoes <support@walkdrobe.in>';
  const safeName = name ? name.trim() : 'Valued Customer';
  const displayCode = code || '123456';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email — SONU Footwear</title>
      <style>
        body { margin: 0; padding: 0; background-color: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111111; }
        .container { max-width: 560px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e5e5; }
        .header { padding: 36px 32px 24px; text-align: center; border-bottom: 1px solid #f0f0f0; }
        .logo { font-size: 28px; font-weight: 800; letter-spacing: 2px; color: #111111; text-transform: uppercase; margin: 0; }
        .tagline { font-size: 12px; color: #707072; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
        .content { padding: 36px 32px; }
        h1 { font-size: 24px; font-weight: 700; color: #111111; margin: 0 0 16px; letter-spacing: -0.5px; }
        p { font-size: 15px; line-height: 1.6; color: #444444; margin: 0 0 16px; }
        .code-box { background-color: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0; }
        .code-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #707072; margin-bottom: 8px; }
        .code-number { font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #111111; font-family: 'Courier New', Courier, monospace; }
        .footer { padding: 24px 32px; background-color: #fafafa; border-top: 1px solid #f0f0f0; text-align: center; font-size: 12px; color: #8d8d8d; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">SONU</div>
          <div class="tagline">for the long way home</div>
        </div>
        <div class="content">
          <h1>Verify your email address</h1>
          <p>Hi ${safeName},</p>
          <p>Thank you for setting up your profile with SONU. To complete your account verification, please enter the 6-digit code below:</p>
          
          <div class="code-box">
            <div class="code-label">Verification Code</div>
            <div class="code-number">${displayCode}</div>
          </div>

          <p style="font-size: 13px; color: #707072;">This verification code will expire in 10 minutes. If you did not request this, please disregard this email.</p>
        </div>
        <div class="footer">
          <p>© 2026 Sonu Shoes Private Limited. All rights reserved.<br>104, Vasan Udyog Bhavan, Lower Parel, Mumbai, MH – 400013</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from,
    to,
    subject: `${displayCode} is your SONU email verification code`,
    text: `Hi ${safeName},\n\nYour SONU verification code is: ${displayCode}\n\nThis code will expire in 10 minutes.\n\n— SONU Footwear\nfor the long way home`,
    html: htmlContent,
  });

  return info;
}
