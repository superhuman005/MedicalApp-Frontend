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
    } catch (error) {
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

  // Generic styled notification, used for events that don't warrant a fully
  // bespoke template (admin alerts, misc account/system updates). data:
  // { name?, title, message, ctaLabel?, ctaUrl? }
  async sendGenericNotification(email, data) {
    const subject = `${data.title} - Medical App`;
    const cta =
      data.ctaUrl && data.ctaLabel
        ? `<div style="text-align: center; margin: 30px 0;">
            <a href="${data.ctaUrl}" style="background: linear-gradient(135deg, #3498db 0%, #2ecc71 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">${data.ctaLabel}</a>
          </div>`
        : "";
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>${data.title}</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">${data.title}</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          ${data.name ? `<h2 style="color: #333;">Hello ${data.name},</h2>` : ""}
          <p>${data.message}</p>
          ${cta}
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Medical App. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
    const text = `${data.name ? `Hello ${data.name},\n\n` : ""}${data.message}${
      data.ctaUrl ? `\n\n${data.ctaLabel || "Open"}: ${data.ctaUrl}` : ""
    }`;

    return this.sendEmail({ to: email, subject, html, text });
  }

  // Sent when a doctor submits the public self-registration form, confirming
  // their application is in the admin approval queue.
  async sendDoctorApplicationReceived(email, data) {
    return this.sendGenericNotification(email, {
      title: "Application Received",
      name: `Dr. ${data.name}`,
      message:
        "Thanks for applying to join Medical App as a doctor. Our admin team is reviewing your " +
        "application - your medical license and details will be checked before your account is " +
        "approved. We'll email you as soon as a decision is made, and you can also sign in any " +
        "time to check your status.",
    });
  }

  // Sent when an admin approves a self-registered (or newly created) doctor.
  async sendDoctorApproved(email, data) {
    return this.sendGenericNotification(email, {
      title: "You're Approved!",
      name: `Dr. ${data.name}`,
      message:
        "Good news - your doctor account has been approved. You can now sign in, complete your " +
        "profile, go online, and start accepting patient consultations.",
      ctaLabel: "Sign In",
      ctaUrl: process.env.FRONTEND_URL,
    });
  }

  // Sent when an admin rejects a doctor's application.
  async sendDoctorRejected(email, data) {
    return this.sendGenericNotification(email, {
      title: "Application Update",
      name: `Dr. ${data.name}`,
      message: `We're unable to approve your doctor application at this time.${
        data.note ? ` Note from our team: ${data.note}` : ""
      } If you believe this is a mistake, please contact support.`,
    });
  }

  // Sent when an admin creates an account (admin or doctor) directly, so the
  // person has their sign-in details even if the creating admin forgets to
  // pass them on. Only includes the password when one was auto-generated.
  async sendAccountCredentials(email, data) {
    const subject = `Your Medical App ${data.role} account is ready`;
    const credentialsBlock = data.temporaryPassword
      ? `<div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Temporary password:</strong> <code>${data.temporaryPassword}</code></p>
          <p style="color: #c0392b; font-size: 13px;">Please sign in and change this password as soon as possible.</p>
        </div>`
      : `<p>Your account was set up with the password chosen by whoever created it.</p>`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>${subject}</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3498db 0%, #2ecc71 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Welcome to Medical App</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hello ${data.name},</h2>
          <p>An administrator created a ${data.role} account for you on Medical App.</p>
          ${credentialsBlock}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/login" style="background: linear-gradient(135deg, #3498db 0%, #2ecc71 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Sign In</a>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Medical App. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
    const text = `Hello ${data.name},\n\nAn administrator created a ${data.role} account for you on Medical App.\n\nEmail: ${email}${
      data.temporaryPassword ? `\nTemporary password: ${data.temporaryPassword}\nPlease change this password after signing in.` : ""
    }\n\nSign in at ${process.env.FRONTEND_URL}/login`;

    return this.sendEmail({ to: email, subject, html, text });
  }

  // Sent to the patient (and, on rejection, to the prescribing doctor too)
  // when an admin fulfills or rejects a prescription sent to the admin team.
  async sendPrescriptionStatusUpdate(email, data) {
    const approved = data.status === "fulfilled";
    const subject = `Prescription ${approved ? "Fulfilled" : "Update"} - Medical App`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>${subject}</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, ${approved ? "#2ecc71 0%, #27ae60" : "#e74c3c 0%, #c0392b"} 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">Prescription ${approved ? "Fulfilled" : "Declined"}</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hello ${data.name},</h2>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <p><strong>Medication:</strong> ${data.medication}</p>
            <p><strong>Status:</strong> ${approved ? "Fulfilled" : "Declined"}</p>
            ${data.note ? `<p><strong>Note from admin:</strong> ${data.note}</p>` : ""}
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Medical App. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
    const text = `Hello ${data.name},\n\nYour prescription for ${data.medication} was ${approved ? "fulfilled" : "declined"}.${
      data.note ? ` Note: ${data.note}` : ""
    }`;

    return this.sendEmail({ to: email, subject, html, text });
  }

  // Sent to a patient when a doctor writes them a new prescription.
  async sendNewPrescription(email, data) {
    const subject = "New Prescription - Medical App";
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>New Prescription</title></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">New Prescription</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Hello ${data.patientName},</h2>
          <p>Dr. ${data.doctorName} has prescribed the following for you:</p>
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <p><strong>Medication:</strong> ${data.medication}</p>
            ${data.dosage ? `<p><strong>Dosage:</strong> ${data.dosage}</p>` : ""}
            ${data.instructions ? `<p><strong>Instructions:</strong> ${data.instructions}</p>` : ""}
          </div>
          <p style="color: #666; font-size: 14px;">You can view this prescription any time in your Medical Records.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} Medical App. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
    const text = `Hello ${data.patientName},\n\nDr. ${data.doctorName} has prescribed the following for you:\n\nMedication: ${data.medication}${
      data.dosage ? `\nDosage: ${data.dosage}` : ""
    }${data.instructions ? `\nInstructions: ${data.instructions}` : ""}`;

    return this.sendEmail({ to: email, subject, html, text });
  }

  // Sent to a doctor when a patient books (or immediately requests) a
  // consultation with them.
  async sendNewBookingRequest(email, data) {
    return this.sendGenericNotification(email, {
      title: "New Booking Request",
      name: `Dr. ${data.doctorName}`,
      message: `${data.patientName} booked a ${data.type} appointment for ${data.date} at ${data.time}.${
        data.reason ? ` Reason: ${data.reason}` : ""
      } Please confirm it from your dashboard.`,
      ctaLabel: "Open Dashboard",
      ctaUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/doctor-dashboard` : undefined,
    });
  }

  // Sent to a doctor when a patient sends an immediate consultation request
  // (either targeted directly at them, or broadcast and they're the first to see it).
  async sendConsultationRequestReceived(email, data) {
    return this.sendGenericNotification(email, {
      title: "New Consultation Request",
      name: `Dr. ${data.doctorName}`,
      message: `${data.patientName} is requesting a ${data.urgency}-priority ${data.type} consultation.`,
      ctaLabel: "Open Dashboard",
      ctaUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/doctor-dashboard` : undefined,
    });
  }

  // Sent to the patient when their consultation request is declined by the doctor it was aimed at.
  async sendConsultationRequestDeclined(email, data) {
    return this.sendGenericNotification(email, {
      title: "Consultation Request Declined",
      name: data.patientName,
      message: `Dr. ${data.doctorName} isn't able to take your ${data.type} consultation request right now. You can send a new request to another available doctor any time.`,
    });
  }

  // Security notice sent whenever a user's password is changed.
  async sendPasswordChangedAlert(email, data) {
    return this.sendGenericNotification(email, {
      title: "Your Password Was Changed",
      name: data.name,
      message:
        "This is a confirmation that the password on your Medical App account was just changed. " +
        "If this wasn't you, please contact support immediately.",
    });
  }

  // Sent when a subscription plan payment (via Paystack) is confirmed.
  async sendSubscriptionPaymentConfirmation(email, data) {
    return this.sendGenericNotification(email, {
      title: "Payment Confirmed",
      name: data.name,
      message: `Your payment of ${data.currency} ${Number(data.amount).toLocaleString()} for the ${data.plan} plan was received. Your subscription is now active.`,
    });
  }

  // Sent when a subscription plan payment fails or can't be verified.
  async sendSubscriptionPaymentFailed(email, data) {
    return this.sendGenericNotification(email, {
      title: "Payment Unsuccessful",
      name: data.name,
      message: `Your payment of ${data.currency} ${Number(data.amount).toLocaleString()} for the ${data.plan} plan wasn't successful${
        data.reason ? ` (${data.reason})` : ""
      }. You can try again any time from your subscription page.`,
    });
  }
}

module.exports = new EmailService();
