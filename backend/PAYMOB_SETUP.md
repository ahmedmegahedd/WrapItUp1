# Paymob Setup Guide

1. Log into https://accept.paymob.com
2. Go to **Settings → Account Info** → copy your API Key → set `PAYMOB_API_KEY` in backend `.env`
3. Go to **Developers → Payment Integrations** → copy Integration ID → set `PAYMOB_INTEGRATION_ID`
4. Go to **Developers → iFrames** → copy your iFrame ID → set `PAYMOB_IFRAME_ID`
5. Go to **Developers → Webhooks** → copy HMAC Secret → set `PAYMOB_HMAC_SECRET`
6. Set webhook URL to: `https://yourdomain.com/api/payments/webhook` (or your backend base URL + `/payments/webhook`)
7. Set `EXPO_PUBLIC_PAYMOB_IFRAME_ID` in mobile `.env` (same value as `PAYMOB_IFRAME_ID` for the mobile app WebView).

**Mobile:** If the app does not have `react-native-webview` installed, add it with: `npx expo install react-native-webview`.
