const QRCode = require('qrcode')

/**
 * Booking Receipt Email Template with QR Code
 * Generates an HTML email containing booking details and a scannable QR code
 */

/**
 * Generate a QR code as a buffer for email attachment
 * @param {string} data - Data to encode in the QR code
 * @returns {Promise<Buffer>} QR code image buffer
 */
const generateQRCodeBuffer = async (data) => {
  return QRCode.toBuffer(data, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 200,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  })
}

/**
 * Format a time from a Date object (stored as 1970-01-01THH:MM:00.000Z)
 */
const formatTime = (timeDate) => {
  if (!timeDate) return 'N/A'
  const d = new Date(timeDate)
  const h = d.getUTCHours()
  const m = d.getUTCMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${m} ${ampm}`
}

/**
 * Format a date nicely
 */
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Generate the booking receipt HTML email
 * @param {Object} params
 * @param {string} params.userName
 * @param {string} params.userEmail
 * @param {string} params.bookingId
 * @param {string} params.venueName
 * @param {string} params.venueAddress
 * @param {string} params.operatorName
 * @param {Date|string} params.bookingDate
 * @param {Date|string} params.startTime
 * @param {Date|string} params.endTime
 * @param {number} params.totalPrice
 * @param {string} params.bookingType - 'venue' or 'event'
 * @param {string} [params.eventTitle] - For event registrations
 * @param {string} [params.transactionId]
 * @returns {Promise<string>} HTML string
 */
const getBookingReceiptTemplate = async ({
  userName,
  userEmail,
  bookingId,
  venueName,
  venueAddress,
  operatorName,
  bookingDate,
  startTime,
  endTime,
  totalPrice,
  bookingType = 'venue',
  eventTitle,
  transactionId,
}) => {
  const bookingDateFormatted = formatDate(bookingDate)
  const startFormatted = formatTime(startTime)
  const endFormatted = formatTime(endTime)
  const shortId = bookingId.split('-')[0].toUpperCase()

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Booking Confirmation - BookMyGame</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">🏆 BookMyGame</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Booking Confirmed!</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:32px 40px 0;">
            <h2 style="margin:0 0 8px;color:#1a1a2e;font-size:20px;">Hi ${userName} 👋</h2>
            <p style="margin:0;color:#6b7280;font-size:15px;">Your ${bookingType === 'event' ? `event registration for <strong>${eventTitle}</strong>` : 'venue booking'} has been <strong style="color:#059669;">confirmed</strong>. Here's your receipt below.</p>
          </td>
        </tr>

        <!-- Booking Details + QR -->
        <tr>
          <td style="padding:24px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7ff;border-radius:12px;overflow:hidden;">
              <tr>
                <!-- Details -->
                <td style="padding:24px;vertical-align:top;width:65%;">
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;color:#7c3aed;letter-spacing:1px;">Booking ID</p>
                  <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#1a1a2e;font-family:monospace;">${shortId}</p>

                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;color:#7c3aed;letter-spacing:1px;">Venue</p>
                  <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#1a1a2e;">${venueName}</p>
                  <p style="margin:0 0 16px;font-size:13px;color:#6b7280;">${venueAddress || ''}</p>

                  ${
                    eventTitle
                      ? `
                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;color:#7c3aed;letter-spacing:1px;">Event</p>
                  <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#1a1a2e;">${eventTitle}</p>
                  `
                      : ''
                  }

                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;color:#7c3aed;letter-spacing:1px;">Date</p>
                  <p style="margin:0 0 16px;font-size:15px;color:#1a1a2e;">${bookingDateFormatted}</p>

                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;color:#7c3aed;letter-spacing:1px;">Time</p>
                  <p style="margin:0 0 16px;font-size:15px;color:#1a1a2e;">${startFormatted} – ${endFormatted}</p>

                  <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;color:#7c3aed;letter-spacing:1px;">Amount Paid</p>
                  <p style="margin:0;font-size:22px;font-weight:700;color:#7c3aed;">Rs. ${parseFloat(totalPrice).toLocaleString()}</p>
                </td>
                <!-- QR Code -->
                <td style="padding:24px 24px;vertical-align:middle;text-align:center;width:35%;">
                  <div style="background:#fff;border-radius:12px;padding:12px;display:inline-block;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    <img src="cid:qrcode@bookmygame.com" alt="Booking QR Code" width="150" height="150" style="display:block;border-radius:4px;" />
                  </div>
                  <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;text-align:center;">Scan at venue<br>for verification</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Operator Info -->
        ${
          operatorName
            ? `
        <tr>
          <td style="padding:0 40px 24px;">
            <p style="margin:0;color:#6b7280;font-size:13px;">Managed by: <strong style="color:#1a1a2e;">${operatorName}</strong></p>
          </td>
        </tr>
        `
            : ''
        }

        <!-- Refund Policy -->
        <tr>
          <td style="padding:0 40px 24px;">
            <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:16px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#92400e;">📋 Cancellation & Refund Policy</p>
              <ul style="margin:0;padding-left:18px;color:#78350f;font-size:13px;line-height:1.7;">
                <li><strong>More than 24h before</strong>: 100% refund</li>
                <li><strong>6h – 24h before</strong>: 50% refund</li>
                <li><strong>Less than 6h or started</strong>: No refund</li>
              </ul>
            </div>
          </td>
        </tr>

        ${
          transactionId
            ? `
        <tr>
          <td style="padding:0 40px 24px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">Transaction ID: <span style="font-family:monospace;">${transactionId}</span></p>
          </td>
        </tr>
        `
            : ''
        }

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:13px;">© ${new Date().getFullYear()} BookMyGame • Questions? Contact your venue operator</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`
}

module.exports = { getBookingReceiptTemplate }
