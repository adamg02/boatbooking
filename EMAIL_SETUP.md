# Email Notifications Setup

This guide explains how to set up email notifications for booking cancellations.

## Overview

When an admin cancels a booking from the admin panel, the system automatically sends an email notification to the user informing them of the cancellation and which admin cancelled it.

## Setup Steps

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com) and sign up for a free account
2. The free tier includes:
   - 3,000 emails per month
   - 100 emails per day
   - No credit card required

### 2. Get Your API Key

1. After signing up, go to **API Keys** in your Resend dashboard
2. Click **Create API Key**
3. Give it a name like "Boat Booking System"
4. Copy the API key (starts with `re_`)

### 3. Verify Your Domain (Production)

For production use, you'll need to verify a domain:

1. Go to **Domains** in your Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records provided by Resend to your domain
5. Wait for verification (usually a few minutes)

**For Development/Testing:**
- You can use the default `onboarding@resend.dev` sender
- This only delivers to your verified email address

### 4. Configure Environment Variables

Add these to your `.env` file:

```bash
# Resend API Key
RESEND_API_KEY="re_your_api_key_here"

# Sender email address
# For testing: use "onboarding@resend.dev"
# For production: use your verified domain, e.g., "Boat Booking <notifications@yourdomain.com>"
EMAIL_FROM="Boat Booking <notifications@yourdomain.com>"
```

### 5. Deploy Configuration

If deploying to Render.com, add these environment variables in your service settings:

1. Go to your service on Render.com
2. Navigate to **Environment** tab
3. Add:
   - `RESEND_API_KEY` = your Resend API key
   - `EMAIL_FROM` = your verified sender email

## Email Features

### Cancellation Email Includes:

- **Boat name** - Which boat was booked
- **Date and time** - When the booking was scheduled
- **Duration** - Start and end times
- **Cancelled by** - Name or email of the admin who cancelled
- Professional HTML and plain text versions
- Mobile-responsive design

### Example Email Preview:

```
Subject: Booking Cancelled: 1x Polycarp 55KG STN107

Hi John,

Your boat booking has been cancelled by an administrator.

Cancelled Booking Details:
- Boat: 1x Polycarp 55KG STN107
- Date & Time: Monday, February 10, 2026 at 9:00 AM
- Duration: 9:00 AM - 11:00 AM
- Cancelled By: Admin User (admin@example.com)

If you have any questions about this cancellation, please contact an administrator.
```

## Testing

To test email notifications:

1. Set up a test account with your own email
2. Create a booking as that user
3. Sign in as an admin
4. Cancel the booking from the admin bookings page
5. Check your email for the notification

## Troubleshooting

### Emails Not Sending

**Check these:**
1. `RESEND_API_KEY` is set correctly in `.env`
2. `EMAIL_FROM` is set correctly
3. For production: Your domain is verified in Resend
4. For testing: You're sending to your verified email address
5. Check application logs for errors

### Common Issues

**"Email service not configured"**
- Missing `RESEND_API_KEY` environment variable
- Solution: Add the key to your `.env` file

**"Sender email not configured"**
- Missing `EMAIL_FROM` environment variable  
- Solution: Add the sender email to your `.env` file

**Emails not received**
- Check spam folder
- For testing, ensure recipient email is verified in Resend
- For production, ensure domain is verified and DNS records are correct

**Rate limits**
- Free tier: 100 emails/day, 3,000/month
- If you hit limits, upgrade your Resend plan

## Email Service Alternatives

While this implementation uses Resend, you can swap it for other providers:

- **SendGrid** - Popular, generous free tier
- **Mailgun** - Flexible pricing
- **AWS SES** - Very affordable for high volume
- **Postmark** - Focus on transactional emails

To switch providers, update `src/lib/email.ts` with the new service's SDK.

## Privacy & Compliance

- Emails are only sent when admins cancel bookings
- User email addresses are stored securely in Supabase
- No tracking pixels or analytics in emails
- Users cannot opt out of cancellation notifications (operational emails)

## Cost Estimation

Based on typical usage:

- **Small club (50 active users):**
  - ~10 cancellations/month
  - Free tier is sufficient

- **Medium club (200 active users):**
  - ~50 cancellations/month  
  - Free tier is sufficient

- **Large club (500+ active users):**
  - ~100-200 cancellations/month
  - Free tier likely sufficient, may need paid plan

Resend pricing beyond free tier: $20/month for 50,000 emails.

## Onboarding Reminder Emails

Users who sign up but never join or create a club receive a one-off re-engagement
email after 3 days, sent by `POST /api/cron/onboarding-reminder`.

### Setup

1. Run `ONBOARDING_REMINDER_MIGRATION.sql` against your Supabase database
   (adds `User.onboardingReminderSentAt` plus a partial index).
2. Add a `CRON_SECRET` environment variable (any long random string).
3. Schedule a daily job with any external cron service (Render Cron Job,
   GitHub Actions schedule, cron-job.org, etc.):

```bash
curl -X POST https://your-app-url/api/cron/onboarding-reminder \
  -H "Authorization: Bearer $CRON_SECRET"
```

Each run processes up to 50 users and marks them with
`onboardingReminderSentAt` only when the email sends successfully, so
transient failures are retried on the next run and each user is emailed at
most once.
