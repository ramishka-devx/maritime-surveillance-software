import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: env.email.secure,
  auth: {
    user: env.email.user,
    pass: env.email.pass,
  },
});

export const emailService = {
  async sendEmail(to, subject, html, text = '') {
    try {
      const mailOptions = {
        from: env.email.from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  },

  async sendNotificationEmail(userEmail, notification) {
    const subject = `Machine Cure - ${notification.title}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${notification.title}</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px; line-height: 1.5;">${notification.message}</p>
        </div>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
          <p>This is an automated notification from Machine Cure.</p>
          <p>Priority: <strong>${notification.priority}</strong></p>
          <p>Type: <strong>${notification.type}</strong></p>
        </div>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, html);
  },
};
