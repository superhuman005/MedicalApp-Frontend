const nodemailer = require('nodemailer');
class EmailService {
    constructor() {
        this.transporter = null;
        this.initialize();
    }
    initialize() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }
    async sendEmail({ to, subject, html, text }) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'Medical App <noreply@medicalapp.com>',
                to,
                subject,
                html,
                text
            };
            const info = await this.transporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: info.messageId
            };
        }
        catch (error) {
            console.error('Email sending error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    async sendVerificationEmail(email, data) {
        const subject = 'Verify Your Email - Medical App';
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Welcome to Medical App</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hello ${data.name},</h2>
          <p>Thank you for registering with Medical App. Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          </div>
          <p style="color: #666; font-size: 14px;">If you did not create an account, please ignore this email.</p>
          <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Medical App. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
        const text = `Hello ${data.name},\n\nPlease verify your email by visiting: ${data.verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you did not create an account, please ignore this email.`;
        return this.sendEmail({ to: email, subject, html, text });
    }
    async sendPasswordResetEmail(email, data) {
        const subject = 'Reset Your Password - Medical App';
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Password Reset</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hello ${data.name},</h2>
          <p>You have requested to reset your password. Click the button below to set a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="color: #666; font-size: 14px;">If you did not request a password reset, please ignore this email.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Medical App. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
        const text = `Hello ${data.name},\n\nPlease reset your password by visiting: ${data.resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request a password reset, please ignore this email.`;
        return this.sendEmail({ to: email, subject, html, text });
    }
    async sendAppointmentConfirmation(email, data) {
        const subject = 'Appointment Confirmed - Medical App';
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Appointment Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #00bc8c 0%, #009972 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Appointment Confirmed</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hello ${data.patientName},</h2>
          <p>Your appointment has been confirmed. Here are the details:</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <p><strong>Doctor:</strong> Dr. ${data.doctorName}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>Type:</strong> ${data.type}</p>
          </div>
          <p style="color: #666; font-size: 14px;">Please arrive 10 minutes before your appointment time.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Medical App. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
        const text = `Hello ${data.patientName},\n\nYour appointment with Dr. ${data.doctorName} has been confirmed.\n\nDate: ${data.date}\nTime: ${data.time}\nType: ${data.type}\n\nPlease arrive 10 minutes before your appointment time.`;
        return this.sendEmail({ to: email, subject, html, text });
    }
    async sendAppointmentReminder(email, data) {
        const subject = 'Appointment Reminder - Medical App';
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Appointment Reminder</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Appointment Reminder</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hello ${data.patientName},</h2>
          <p>This is a reminder for your upcoming appointment:</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <p><strong>Doctor:</strong> Dr. ${data.doctorName}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>Type:</strong> ${data.type}</p>
          </div>
          <p style="color: #666; font-size: 14px;">Please arrive 10 minutes before your appointment time. If you need to cancel, please do so at least 24 hours in advance.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Medical App. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
        const text = `Hello ${data.patientName},\n\nReminder: Your appointment with Dr. ${data.doctorName} is tomorrow.\n\nDate: ${data.date}\nTime: ${data.time}\nType: ${data.type}\n\nPlease arrive 10 minutes before your appointment time.`;
        return this.sendEmail({ to: email, subject, html, text });
    }
    async sendAppointmentCancelled(email, data) {
        const subject = 'Appointment Cancelled - Medical App';
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Appointment Cancelled</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Appointment Cancelled</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hello,</h2>
          <p>An appointment has been cancelled:</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <p><strong>Doctor:</strong> Dr. ${data.doctorName}</p>
            <p><strong>Patient:</strong> ${data.patientName}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>Cancelled by:</strong> ${data.cancelledByName}</p>
            <p><strong>Reason:</strong> ${data.reason}</p>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Medical App. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
        const text = `Appointment Cancelled\n\nDoctor: Dr. ${data.doctorName}\nPatient: ${data.patientName}\nDate: ${data.date}\nTime: ${data.time}\nCancelled by: ${data.cancelledByName}\nReason: ${data.reason}`;
        return this.sendEmail({ to: email, subject, html, text });
    }
    async sendPaymentConfirmation(email, data) {
        const subject = 'Payment Confirmed - Medical App';
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Payment Confirmed</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hello ${data.patientName},</h2>
          <p>Your payment has been received successfully.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <p><strong>Amount:</strong> ${data.currency} ${data.amount.toLocaleString()}</p>
            <p><strong>Doctor:</strong> Dr. ${data.doctorName}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.time}</p>
          </div>
          <p style="color: #666; font-size: 14px;">Thank you for your payment.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Medical App. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
        const text = `Hello ${data.patientName},\n\nYour payment of ${data.currency} ${data.amount.toLocaleString()} has been received.\n\nDoctor: Dr. ${data.doctorName}\nDate: ${data.date}\nTime: ${data.time}\n\nThank you for your payment.`;
        return this.sendEmail({ to: email, subject, html, text });
    }
    async sendRefundNotification(email, data) {
        const subject = 'Refund Processed - Medical App';
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Refund Processed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Refund Processed</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hello,</h2>
          <p>Your refund has been processed successfully.</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <p><strong>Amount Refunded:</strong> ${data.currency} ${data.amount.toLocaleString()}</p>
            <p><strong>Refund Date:</strong> ${new Date(data.refundedAt).toLocaleDateString()}</p>
          </div>
          <p style="color: #666; font-size: 14px;">Please allow 5-10 business days for the refund to reflect in your account.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Medical App. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
        const text = `Hello,\n\nYour refund of ${data.currency} ${data.amount.toLocaleString()} has been processed.\n\nRefund Date: ${new Date(data.refundedAt).toLocaleDateString()}\n\nPlease allow 5-10 business days for the refund to reflect in your account.`;
        return this.sendEmail({ to: email, subject, html, text });
    }
    async sendConsultationSummary(email, data) {
        const subject = 'Consultation Summary - Medical App';
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Consultation Summary</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Consultation Summary</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hello ${data.patientName},</h2>
          <p>Thank you for your consultation. Here is your summary:</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Duration:</strong> ${data.duration}</p>
            <p><strong>Diagnosis:</strong> ${data.diagnosis}</p>
          </div>
          <p style="color: #666; font-size: 14px;">Please follow the doctor's instructions for follow-up care.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Medical App. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
        const text = `Hello ${data.patientName},\n\nThank you for your consultation.\n\nDate: ${data.date}\nDuration: ${data.duration}\nDiagnosis: ${data.diagnosis}\n\nPlease follow the doctor's instructions for follow-up care.`;
        return this.sendEmail({ to: email, subject, html, text });
    }
    async sendWelcomeEmail(email, data) {
        const subject = 'Welcome to Medical App';
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Medical App</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3498db 0%, #2ecc71 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Welcome to Medical App</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hello ${data.name},</h2>
          <p>Welcome to Medical App, your trusted healthcare companion!</p>
          <p>With Medical App, you can:</p>
          <ul style="color: #555;">
            <li>Book appointments with verified doctors</li>
            <li>Access your medical records anytime</li>
            <li>Have video consultations from anywhere</li>
            <li>Get prescription reminders</li>
            <li>Track your health journey</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}" style="background: linear-gradient(135deg, #3498db 0%, #2ecc71 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Get Started</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Medical App. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
        const text = `Hello ${data.name},\n\nWelcome to Medical App, your trusted healthcare companion!\n\nWith Medical App, you can:\n- Book appointments with verified doctors\n- Access your medical records anytime\n- Have video consultations from anywhere\n- Get prescription reminders\n- Track your health journey\n\nVisit ${process.env.FRONTEND_URL} to get started.`;
        return this.sendEmail({ to: email, subject, html, text });
    }
}
module.exports = new EmailService();
//# sourceMappingURL=emailService.js.map