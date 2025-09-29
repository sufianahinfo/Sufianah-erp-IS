# Firebase Setup Guide for Sufianah Islamic Store ERP

## Quick Setup

The application requires Firebase configuration to function properly. Follow these steps:

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `sufianah-islamic-store-erp`
4. Follow the setup wizard

### 2. Enable Firebase Realtime Database

1. In your Firebase project, go to "Realtime Database"
2. Click "Create Database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users
5. Copy the database URL (it will look like: `https://your-project-id-default-rtdb.firebaseio.com`)

### 3. Get Web App Configuration

1. In Firebase Console, go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Add app" and select the web icon (`</>`)
4. Register your app with a nickname
5. Copy the Firebase configuration object

### 4. Create Environment File

Create a file named `.env.local` in your project root with the following content:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

Replace all placeholder values with your actual Firebase project credentials.

### 5. Test the Application

After setting up the environment variables:

1. Stop the development server (Ctrl+C)
2. Run `npm run dev` again
3. Open http://localhost:3000 in your browser

## Security Rules (Optional)

For production, update your Firebase Realtime Database rules:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

## Troubleshooting

- Make sure all environment variables start with `NEXT_PUBLIC_`
- Ensure the `.env.local` file is in the project root directory
- Restart the development server after creating the environment file
- Check that Firebase Realtime Database is enabled in your project
