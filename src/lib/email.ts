import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface CancellationEmailParams {
  userName: string;
  userEmail: string;
  boatName: string;
  startTime: string;
  endTime: string;
  cancelledBy: string;
}

export async function sendBookingCancellationEmail({
  userName,
  userEmail,
  boatName,
  startTime,
  endTime,
  cancelledBy,
}: CancellationEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email notification');
    return { success: false, error: 'Email service not configured' };
  }

  if (!process.env.EMAIL_FROM) {
    console.warn('EMAIL_FROM not configured, skipping email notification');
    return { success: false, error: 'Sender email not configured' };
  }

  try {
    const formattedStartTime = new Date(startTime).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const formattedEndTime = new Date(endTime).toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [userEmail],
      subject: `Booking Cancelled: ${boatName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Cancelled</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Booking Cancelled</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 16px; color: #374151; margin-top: 0;">Hi ${userName || 'there'},</p>
              
              <p style="font-size: 16px; color: #374151;">Your boat booking has been cancelled by an administrator.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ef4444;">
                <h2 style="color: #ef4444; margin-top: 0; font-size: 20px;">Cancelled Booking Details</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Boat:</td>
                    <td style="padding: 8px 0; color: #111827;">${boatName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Date & Time:</td>
                    <td style="padding: 8px 0; color: #111827;">${formattedStartTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Duration:</td>
                    <td style="padding: 8px 0; color: #111827;">${formattedStartTime.split(' at ')[1] || formattedStartTime} - ${formattedEndTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Cancelled By:</td>
                    <td style="padding: 8px 0; color: #111827;">${cancelledBy}</td>
                  </tr>
                </table>
              </div>
              
              <p style="font-size: 16px; color: #374151;">If you have any questions about this cancellation, please contact an administrator.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">This is an automated notification from the Boat Booking System.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Hi ${userName || 'there'},

Your boat booking has been cancelled by an administrator.

Cancelled Booking Details:
- Boat: ${boatName}
- Date & Time: ${formattedStartTime}
- Duration: ${formattedStartTime} - ${formattedEndTime}
- Cancelled By: ${cancelledBy}

If you have any questions about this cancellation, please contact an administrator.

This is an automated notification from the Boat Booking System.
      `.trim(),
    });

    if (error) {
      console.error('Failed to send cancellation email:', error);
      return { success: false, error };
    }

    console.log('Cancellation email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    return { success: false, error };
  }
}
