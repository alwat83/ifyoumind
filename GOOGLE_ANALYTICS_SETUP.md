# Google Analytics 4 connector setup

The 2.0 GA4 connector uses Google's server-side OAuth 2.0 flow with read-only Analytics access.

## Google Cloud setup

1. Use the Google Cloud project that will own the ifYouMind integration.
2. Enable the Google Analytics Admin API and Google Analytics Data API.
3. Configure the OAuth consent screen for ifYouMind.
4. Create an OAuth 2.0 **Web application** client.
5. Add this authorized redirect URI:

```
https://us-central1-ifyoumind-473fe.cloudfunctions.net/googleAnalyticsOAuthCallback
```

The redirect must match exactly.

## Firebase function secrets

Configure these secrets before deploying the OAuth functions:

- `GOOGLE_OAUTH_CLIENT_ID` — OAuth web client ID.
- `GOOGLE_OAUTH_CLIENT_SECRET` — OAuth web client secret.
- `GOOGLE_TOKEN_ENCRYPTION_KEY` — base64-encoded 32-byte random key used for AES-256-GCM encryption of refresh tokens.

The app requests only:

```
https://www.googleapis.com/auth/analytics.readonly
```

The OAuth flow requests offline access because scheduled synchronization must refresh access without requiring the user to be present.

## Optional parameters

Production defaults are already defined:

- `INTELLIGENCE_APP_ORIGIN=https://ifyoumind.com`
- `GOOGLE_ANALYTICS_REDIRECT_URI=https://us-central1-ifyoumind-473fe.cloudfunctions.net/googleAnalyticsOAuthCallback`

Override them only for another deployment environment.

## Current connector state

Implemented:

- tenant-authorized connection initiation;
- short-lived CSRF state;
- Google authorization redirect;
- authorization-code exchange;
- encrypted refresh-token storage;
- public connection status API;
- Overview → Connections UI.

Next:

- decrypt/refresh server-side credential;
- discover accessible GA4 properties;
- let the user select a property;
- sync Sessions and Key events into normalized `MetricFact` records;
- populate the first real dashboard card and evidence-backed comparison.
