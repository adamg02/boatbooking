import { Resend } from 'resend';
import { sanitizeForEmail } from './html-sanitize';

// Lazily constructed so importing this module never throws when
// RESEND_API_KEY is absent (e.g. at build time or in dev without email).
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

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

    // Sanitize all user-provided data to prevent XSS in emails
    const safeUserName = sanitizeForEmail(userName);
    const safeBoatName = sanitizeForEmail(boatName);
    const safeCancelledBy = sanitizeForEmail(cancelledBy);

    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM,
      to: [userEmail],
      subject: `Booking Cancelled: ${safeBoatName}`,
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
              <p style="font-size: 16px; color: #374151; margin-top: 0;">Hi ${safeUserName || 'there'},</p>
              
              <p style="font-size: 16px; color: #374151;">Your boat booking has been cancelled by an administrator.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ef4444;">
                <h2 style="color: #ef4444; margin-top: 0; font-size: 20px;">Cancelled Booking Details</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Boat:</td>
                    <td style="padding: 8px 0; color: #111827;">${safeBoatName}</td>
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
                    <td style="padding: 8px 0; color: #111827;">${safeCancelledBy}</td>
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
Hi ${safeUserName || 'there'},

Your boat booking has been cancelled by an administrator.

Cancelled Booking Details:
- Boat: ${safeBoatName}
- Date & Time: ${formattedStartTime}
- Duration: ${formattedStartTime} - ${formattedEndTime}
- Cancelled By: ${safeCancelledBy}

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

interface OnboardingReminderEmailParams {
  userName: string;
  userEmail: string;
  appUrl: string;
}

/**
 * Re-engagement email for users who signed up but never joined or created a club.
 */
export async function sendOnboardingReminderEmail({
  userName,
  userEmail,
  appUrl,
}: OnboardingReminderEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping onboarding reminder');
    return { success: false, error: 'Email service not configured' };
  }

  if (!process.env.EMAIL_FROM) {
    console.warn('EMAIL_FROM not configured, skipping onboarding reminder');
    return { success: false, error: 'Sender email not configured' };
  }

  try {
    const safeUserName = sanitizeForEmail(userName);
    const onboardingUrl = `${appUrl}/onboarding`;

    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM,
      to: [userEmail],
      subject: 'Finish setting up your RowBook account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Finish setting up RowBook</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🚣 You're nearly there!</h1>
            </div>

            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
              <p style="font-size: 16px; color: #374151; margin-top: 0;">Hi ${safeUserName || 'there'},</p>

              <p style="font-size: 16px; color: #374151;">You signed up for RowBook but haven't joined a club yet. There are two quick ways to get going:</p>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2563eb;">
                <p style="margin: 0 0 8px 0; color: #111827;"><strong>Have a join code?</strong> Enter it on the onboarding page to join your club.</p>
                <p style="margin: 0; color: #111827;"><strong>No code?</strong> Create your club in under a minute — you'll get a code to invite your clubmates.</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${onboardingUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px;">Finish Setting Up</a>
              </div>

              <p style="font-size: 14px; color: #6b7280;">Waiting on a join code? Forward this email to whoever runs bookings at your club and ask them to set it up.</p>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">This is a one-off reminder from RowBook. You won't receive it again.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Hi ${safeUserName || 'there'},

You signed up for RowBook but haven't joined a club yet. There are two quick ways to get going:

- Have a join code? Enter it on the onboarding page to join your club.
- No code? Create your club in under a minute — you'll get a code to invite your clubmates.

Finish setting up: ${onboardingUrl}

Waiting on a join code? Forward this email to whoever runs bookings at your club and ask them to set it up.

This is a one-off reminder from RowBook. You won't receive it again.
      `.trim(),
    });

    if (error) {
      console.error('Failed to send onboarding reminder:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending onboarding reminder:', error);
    return { success: false, error };
  }
}
