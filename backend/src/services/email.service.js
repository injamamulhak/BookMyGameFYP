const nodemailer = require('nodemailer')
const QRCode = require('qrcode')
const emailConfig = require('../config/email.config')
const {
  getVerificationEmailTemplate,
  getPasswordResetTemplate,
} = require('../utils/email.templates')
const {
  getBookingReceiptTemplate,
} = require('../utils/bookingReceipt.template')
class EmailService {
  constructor() {
    this.transporter = null
    this.initializeTransporter()
  }

  /**
   * Initialize NodeMailer transporter
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: emailConfig.auth,
      })

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service error:', error.message)
          console.log(
            '⚠️  Email sending will not work. Please check your email configuration.',
          )
        } else {
          console.log('✅ Email service is ready to send emails')
        }
      })
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message)
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email, userName, verificationToken) {
    try {
      // Construct verification link
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`

      // Get HTML template
      const htmlContent = getVerificationEmailTemplate(
        userName,
        verificationToken,
        verificationLink,
      )

      // Email options
      const mailOptions = {
        from: emailConfig.from,
        to: email,
        subject: 'Verify Your Email - BookMyGame',
        html: htmlContent,
        text: `Hi ${userName},\n\nWelcome to BookMyGame! Please verify your email by clicking this link: ${verificationLink}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.`,
      }

      // Send email
      const info = await this.transporter.sendMail(mailOptions)

      console.log('✅ Verification email sent:', info.messageId)
      console.log('📧 Sent to:', email)

      return {
        success: true,
        messageId: info.messageId,
      }
    } catch (error) {
      console.error('❌ Error sending verification email:', error)

      // Don't throw error - allow user registration to continue even if email fails
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, userName, resetToken) {
    try {
      // Construct reset link
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`

      // Get HTML template
      const htmlContent = getPasswordResetTemplate(userName, resetLink)

      // Email options
      const mailOptions = {
        from: emailConfig.from,
        to: email,
        subject: 'Reset Your Password - BookMyGame',
        html: htmlContent,
        text: `Hi ${userName},\n\nWe received a request to reset your password. Please reset your password by clicking this link: ${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, please ignore this email.`,
      }

      // Send email
      const info = await this.transporter.sendMail(mailOptions)

      console.log('✅ Password reset email sent:', info.messageId)
      console.log('📧 Sent to:', email)

      return {
        success: true,
        messageId: info.messageId,
      }
    } catch (error) {
      console.error('❌ Error sending password reset email:', error)

      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Send booking receipt email with QR code
   */
  async sendBookingReceipt(email, receiptData) {
    try {
      // Generate QR code data
      const qrData = JSON.stringify({
        bookingId: receiptData.bookingId,
        type: receiptData.bookingType || 'venue',
        venue: receiptData.venueName,
        date: new Date(receiptData.bookingDate).toISOString().split('T')[0],
        user: receiptData.userEmail,
      })

      // Generate QR code as buffer
      const qrBuffer = await QRCode.toBuffer(qrData, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 200,
        color: { dark: '#1a1a2e', light: '#ffffff' },
      })

      const htmlContent = await getBookingReceiptTemplate(receiptData)

      const mailOptions = {
        from: emailConfig.from,
        to: email,
        subject: `Booking Confirmed – ${receiptData.venueName} | BookMyGame`,
        html: htmlContent,
        text: `Hi ${receiptData.userName}, your booking at ${receiptData.venueName} on ${new Date(receiptData.bookingDate).toDateString()} is confirmed. Booking ID: ${receiptData.bookingId}. Amount: Rs. ${receiptData.totalPrice}.`,
        attachments: [
          {
            filename: 'qrcode.png',
            content: qrBuffer,
            cid: 'qrcode@bookmygame.com', // Content-ID for inline attachment
          },
        ],
      }

      const info = await this.transporter.sendMail(mailOptions)
      console.log('✅ Booking receipt sent:', info.messageId)
      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error('❌ Error sending booking receipt:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send event registration receipt email with QR code
   */
  async sendEventRegistrationReceipt(email, receiptData) {
    try {
      const {
        userName, userEmail, registrationId, eventTitle, venueName, venueAddress,
        startDate, endDate, amount, transactionId,
      } = receiptData;

      // Generate QR code
      const qrData = JSON.stringify({
        registrationId,
        type: 'event',
        event: eventTitle,
        venue: venueName,
        user: userEmail,
      });
      const qrBuffer = await QRCode.toBuffer(qrData, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 200,
        color: { dark: '#1a1a2e', light: '#ffffff' },
      });

      const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      const html = `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f6fb;padding:32px 0;margin:0;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:28px 32px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:24px;">🏆 Event Registration Confirmed!</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);">BookMyGame</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#374151;font-size:15px;">Hi <strong>${userName}</strong>,</p>
    <p style="color:#6b7280;">You are registered for the event below. Show the QR code at the venue.</p>
    <div style="background:#f3f4f6;border-radius:12px;padding:20px;margin:20px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Event</td><td style="padding:6px 0;font-weight:600;color:#111827;">${eventTitle}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Venue</td><td style="padding:6px 0;color:#374151;">${venueName}</td></tr>
        ${venueAddress ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Address</td><td style="padding:6px 0;color:#374151;">${venueAddress}</td></tr>` : ''}
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Start Date</td><td style="padding:6px 0;color:#374151;">${formatDate(startDate)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">End Date</td><td style="padding:6px 0;color:#374151;">${formatDate(endDate)}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Amount Paid</td><td style="padding:6px 0;font-weight:700;color:#059669;">Rs. ${parseFloat(amount).toLocaleString()}</td></tr>
        <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;">Transaction ID</td><td style="padding:6px 0;font-family:monospace;font-size:12px;color:#374151;">${transactionId || registrationId}</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <img src="cid:qrcode@bookmygame.com" alt="QR Code" style="width:160px;height:160px;border-radius:8px;" />
      <p style="color:#9ca3af;font-size:12px;margin-top:8px;">Scan this QR code at the venue</p>
    </div>
    <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;"/>
    <p style="color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} BookMyGame</p>
  </div>
</div>
</body></html>`;

      const info = await this.transporter.sendMail({
        from: emailConfig.from,
        to: email,
        subject: `Event Registration Confirmed – ${eventTitle} | BookMyGame`,
        html,
        text: `Hi ${userName}, you are confirmed for "${eventTitle}" at ${venueName}. Amount: Rs. ${amount}. Registration ID: ${registrationId}.`,
        attachments: [{
          filename: 'qrcode.png',
          content: qrBuffer,
          cid: 'qrcode@bookmygame.com',
        }],
      });

      console.log('✅ Event registration receipt sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending event registration receipt:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send cancellation email with refund info
   */
  async sendCancellationEmail(
    email,
    {
      userName,
      venueName,
      bookingDate,
      refundAmount,
      refundPercent,
      bookingId,
    },
  ) {
    try {
      const refundNote =
        refundPercent > 0
          ? `<p style="color:#059669;font-weight:600;">💰 Refund of Rs. ${parseFloat(refundAmount).toLocaleString()} (${refundPercent}%) has been initiated to your Khalti wallet.</p>`
          : `<p style="color:#dc2626;">No refund applies (cancellation within 6 hours of booking time).</p>`

      const html = `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f6fb;padding:32px 0;margin:0;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
  <div style="background:#ef4444;padding:28px 32px;text-align:center;">
    <h1 style="margin:0;color:#fff;font-size:24px;">Booking Cancelled</h1>
    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);">BookMyGame</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#374151;font-size:15px;">Hi <strong>${userName}</strong>,</p>
    <p style="color:#6b7280;">Your booking at <strong>${venueName}</strong> on ${new Date(bookingDate).toDateString()} has been cancelled.</p>
    ${refundNote}
    <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Booking ID: <span style="font-family:monospace;">${bookingId}</span></p>
    <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;"/>
    <p style="color:#9ca3af;font-size:12px;text-align:center;">© ${new Date().getFullYear()} BookMyGame</p>
  </div>
</div>
</body></html>`

      const info = await this.transporter.sendMail({
        from: emailConfig.from,
        to: email,
        subject: `Booking Cancelled – ${venueName} | BookMyGame`,
        html,
        text: `Hi ${userName}, your booking at ${venueName} has been cancelled. ${refundPercent > 0 ? `Refund of Rs. ${refundAmount} initiated.` : 'No refund applicable.'}`,
      })
      console.log('✅ Cancellation email sent:', info.messageId)
      return { success: true }
    } catch (error) {
      console.error('❌ Error sending cancellation email:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Test email connection
   */
  async testConnection() {
    try {
      await this.transporter.verify()
      return { success: true, message: 'Email service is working' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

module.exports = new EmailService()
