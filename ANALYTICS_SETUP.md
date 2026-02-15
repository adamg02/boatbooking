# Google Analytics Setup Guide

This guide explains how to set up Google Analytics tracking for the Boat Booking application.

## Overview

The application supports optional Google Analytics (GA4) tracking. When configured, all page views and user interactions will be tracked automatically.

## Features

- **Optional Integration**: Google Analytics is completely optional - the app works without it
- **Environment-based Configuration**: Controlled via `.env` file
- **Next.js Optimized**: Uses `@next/third-parties` package for optimal performance
- **GA4 Support**: Uses the latest Google Analytics 4 measurement protocol

## Prerequisites

- A Google Analytics 4 account
- A GA4 property set up for your website

## Setup Instructions

### 1. Create a Google Analytics 4 Property

If you don't already have one:

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click **Admin** (gear icon in the bottom left)
4. Click **Create Property**
5. Fill in your property details:
   - Property name: "Boat Booking" (or your preferred name)
   - Reporting time zone: Your time zone
   - Currency: Your currency
6. Click **Next**
7. Fill in business information and click **Create**
8. Accept the Terms of Service

### 2. Get Your Measurement ID

1. In Google Analytics Admin, click on **Data Streams**
2. Click on your web data stream (or create one if you haven't)
3. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

### 3. Configure Environment Variable

Add the Measurement ID to your `.env` file:

```env
# Google Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

Replace `G-XXXXXXXXXX` with your actual Measurement ID.

### 4. Restart the Development Server

If you're running the development server:

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

For production builds:

```bash
npm run build
npm start
```

## Verification

### Check if Google Analytics is Working

1. Start your application
2. Open your browser's Developer Tools (F12)
3. Go to the **Network** tab
4. Filter by "google-analytics" or "gtag"
5. Navigate to different pages in your app
6. You should see requests to Google Analytics

### Real-time Reports

1. Go to your Google Analytics property
2. Click on **Reports** → **Realtime**
3. Open your application in a browser
4. You should see your session appear in the real-time report within a few seconds

## What Gets Tracked

The current implementation automatically tracks:

- **Page Views**: Every time a user navigates to a different page
- **Navigation**: Client-side routing between pages
- **User Sessions**: How long users spend on your site
- **Basic Demographics**: Country, browser, device type (if available)

## Privacy Considerations

### GDPR Compliance

If you serve users in the EU, consider:

1. **Cookie Consent**: Implement a cookie consent banner before loading analytics
2. **Privacy Policy**: Update your privacy policy to mention Google Analytics
3. **Data Processing Agreement**: Sign Google's data processing terms
4. **IP Anonymization**: GA4 does this by default

### Disabling Analytics

To disable Google Analytics:

1. Remove the `NEXT_PUBLIC_GA_MEASUREMENT_ID` from your `.env` file, or
2. Set it to an empty string: `NEXT_PUBLIC_GA_MEASUREMENT_ID=""`
3. Restart your application

No tracking scripts will be loaded when the measurement ID is not set.

## Production Deployment

### Environment Variables

When deploying to production, ensure you:

1. Set the `NEXT_PUBLIC_GA_MEASUREMENT_ID` environment variable in your hosting platform
2. Use your production Measurement ID (not your development one if you have multiple properties)

### Vercel Deployment

If deploying to Vercel:

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` with your Measurement ID
4. Redeploy your application

### Other Hosting Platforms

Similar process for other platforms:
- Render: Environment tab in dashboard
- Netlify: Site settings → Environment variables
- Railway: Variables tab

## Troubleshooting

### Analytics Not Showing Data

**Problem**: No data appears in Google Analytics

**Solutions**:
1. Check that `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set correctly
2. Verify the Measurement ID format is correct (G-XXXXXXXXXX)
3. Restart your application after setting the environment variable
4. Check browser console for JavaScript errors
5. Ensure you're not using an ad blocker that blocks analytics
6. Wait a few minutes - data can take time to appear

### Build Errors

**Problem**: Build fails with errors related to Google Analytics

**Solutions**:
1. Ensure `@next/third-parties` package is installed: `npm install @next/third-parties`
2. Check that you're using a compatible version of Next.js (15+)
3. Clear build cache: `rm -rf .next && npm run build`

### Environment Variable Not Working

**Problem**: Environment variable seems to be ignored

**Solutions**:
1. Ensure the variable starts with `NEXT_PUBLIC_` prefix
2. Restart the development server after changing `.env`
3. For production builds, rebuild the application
4. Check that `.env` file is in the root directory
5. Ensure `.env` is not ignored by git (but keep it out of version control)

## Advanced Configuration

### Custom Events

To track custom events, you can use the global `gtag` function:

```typescript
// Example: Track a booking event
if (typeof window !== 'undefined' && window.gtag) {
  window.gtag('event', 'booking_created', {
    boat_id: boatId,
    slot_time: slotTime,
  });
}
```

Add this code in your React components where you want to track events.

### Type Definitions

For TypeScript support with custom events, add to your type definitions:

```typescript
// types/gtag.d.ts
interface Window {
  gtag?: (
    command: 'event' | 'config' | 'set',
    targetId: string,
    config?: Record<string, any>
  ) => void;
}
```

## Resources

- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/10089681)
- [Next.js Third Party Integrations](https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries)
- [@next/third-parties Package](https://www.npmjs.com/package/@next/third-parties)
- [GA4 Privacy Guide](https://support.google.com/analytics/topic/2919631)

## Support

For issues specific to:
- **Google Analytics setup**: Check Google Analytics Help Center
- **Application integration**: Open an issue on the GitHub repository
- **Privacy/GDPR compliance**: Consult with a legal professional
