# OAuth Authentication Setup Guide

This application now requires OAuth authentication with Google. Only users with `@tryplayground.com` email addresses can log in.

## Setup Steps

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - Your production domain (when deploying)
   - Add authorized redirect URIs:
     - `http://localhost:5173` (for development)
     - Your production domain (when deploying)
   - Click "Create"
5. Copy the "Client ID" (it should look like: `xxxxx.apps.googleusercontent.com`)

### 2. Configure Environment Variables

1. Create a `.env` file in the project root (if not already created)
2. Add your Google Client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
   ```

### 3. Run the Application

```bash
npm run dev
```

## How It Works

### Authentication Flow

1. User visits the application
2. If not authenticated, they see the login screen
3. User clicks "Sign in with Google"
4. Google OAuth popup appears
5. User selects their Google account
6. Application validates:
   - Email is verified
   - Email ends with `@tryplayground.com`
7. If valid, user is logged in and can access the app
8. If invalid, login is rejected with an error message

### Email Domain Restriction

The application only allows emails from the `@tryplayground.com` domain. This is enforced in the `AuthContext.tsx` file:

```typescript
const ALLOWED_DOMAIN = "@tryplayground.com";
```

To change the allowed domain, update this constant in [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx).

### User Session

- User session is persisted in `localStorage`
- User remains logged in even after page refresh
- User can logout by clicking their profile picture in the header

### Components Added

- **AuthContext.tsx**: Manages authentication state and provides auth hooks
- **Login.tsx**: Login screen component with Google OAuth button
- **Header.tsx**: Updated with user profile menu and logout

## Security Notes

- The `.env` file is gitignored to prevent accidental commits of sensitive credentials
- Email verification is checked before granting access
- Domain restriction is enforced on the client side
- For production, consider adding server-side validation as well

## Troubleshooting

### "Login Failed" Error

- Verify your Google Client ID is correct in `.env`
- Check that your domain is added to authorized origins in Google Console
- Ensure the Google+ API is enabled

### Email Not Allowed Error

- Confirm the user's email ends with `@tryplayground.com`
- Check the ALLOWED_DOMAIN constant in AuthContext.tsx

### User Profile Not Showing

- Clear localStorage and try logging in again
- Check browser console for errors
