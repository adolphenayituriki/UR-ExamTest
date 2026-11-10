import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
    console.warn('[email] SMTP not configured. OTP emails will be logged to console instead.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: Number(EMAIL_PORT) === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  return transporter;
}

export async function sendOTPEmail(to, code, name = 'Staff') {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2a30; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f6f8f7; border-radius: 8px; padding: 32px; border: 1px solid #dce2e5;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 56px; height: 56px; background: #138abb; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>
        <h1 style="color: #138abb; font-size: 24px; margin: 0 0 16px; text-align: center;">UR ExamLab — Staff Sign In</h1>
        <p style="font-size: 16px; color: #43515b; margin-bottom: 24px;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 16px; color: #43515b; margin-bottom: 24px;">Your one-time sign-in code is:</p>
        <div style="text-align: center; margin: 32px 0;">
          <span style="display: inline-block; font-family: 'SF Mono', 'Consolas', monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #138abb; background: #eaf6fb; padding: 16px 32px; border-radius: 8px; border: 2px solid #138abb;">${code}</span>
        </div>
        <p style="font-size: 14px; color: #68767f; margin-bottom: 8px;">This code expires in <strong>10 minutes</strong> and can only be used once.</p>
        <p style="font-size: 14px; color: #68767f; margin-bottom: 24px;">If you didn't request this code, please ignore this email or contact IT support.</p>
        <hr style="border: none; border-top: 1px solid #dce2e5; margin: 24px 0;" />
        <p style="font-size: 12px; color: #98a4aa; text-align: center; margin: 0;">University of Rwanda · ExamLab · 2025/2026</p>
      </div>
    </body>
    </html>
  `;

  const text = `
UR ExamLab — Staff Sign In

Hello ${name},

Your one-time sign-in code is: ${code}

This code expires in 10 minutes and can only be used once.

If you didn't request this code, please ignore this email or contact IT support.

University of Rwanda · ExamLab · 2025/2026
  `.trim();

  const tx = getTransporter();
  if (!tx) {
    console.log(`[email] OTP for ${to}: ${code}`);
    return { success: true, preview: true };
  }

  const from = process.env.EMAIL_FROM || 'UR ExamLab <noreply@ur-examlab.ac.rw>';
  await tx.sendMail({ from, to, subject: 'Your UR ExamLab Staff Sign-In Code', text, html });
  return { success: true };
}