# 🔥 Firebase Setup Guide

## Overview

This project uses Firebase Firestore as the cloud database backend. This guide will help you set up and test your Firebase connection.

## Prerequisites

- A Google account
- Internet connection
- Node.js and npm installed

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" (or select an existing one)
3. Follow the setup wizard:
   - Enter project name (e.g., "p-l-manager")
   - Enable Google Analytics (optional)
   - Select or create Analytics account (if enabled)

## Step 2: Enable Firestore

1. In Firebase Console, select your project
2. Click on "Firestore Database" in the left menu
3. Click "Create database"
4. Choose a location closest to your users
5. Start in **test mode** for development (you can change security rules later)

## Step 3: Get Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click on the web icon `</>` to add a web app
5. Register your app with a nickname (e.g., "P&L Manager Web")
6. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

## Step 4: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. Save the file

## Step 5: Test Connection

Run the Firebase connection tests:

```bash
npm test src/services/FirestoreService.connection.test.ts
```

You should see:
- ✅ Configuration tests passing
- ✅ Initialization tests passing
- ✅ Connection test successful
- ✅ CRUD operations working (if rules allow)

## Step 6: Configure Security Rules (Production)

For production, update your Firestore security rules:

1. Go to Firebase Console > Firestore Database > Rules
2. Update the rules to restrict access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // More specific rules for each collection
    match /proveedores/{providerId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /productos/{productId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /facturas/{invoiceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /cierres/{closingId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click "Publish" to save the rules

## Troubleshooting

### Error: "Permission denied on resource project"

**Solution**: 
- Check that Firestore is enabled in your project
- Verify security rules allow access
- Make sure you're using the correct project ID

### Error: "Could not reach Cloud Firestore backend"

**Solution**:
- Check your internet connection
- Verify API key is correct in .env
- Check if Firebase services are operational: https://status.firebase.google.com

### Error: "Firebase: Error (auth/api-key-not-valid)"

**Solution**:
- Double-check your API key in .env
- Make sure there are no extra spaces or quotes
- Regenerate API key if needed in Firebase Console

### Tests skip with "Firebase not configured"

**Solution**:
- Make sure .env file exists (not .env.example)
- Verify environment variables start with `VITE_`
- Restart your development server after creating .env

## Collections Structure

The application uses these Firestore collections:

- **proveedores**: Provider/supplier information
- **productos**: Product inventory
- **facturas**: Invoices and delivery notes
- **cierres**: Cash register closings
- **inventarios**: Inventory counts

## Features

✅ **Automatic Sync**: All data automatically syncs to Firebase  
✅ **Offline Support**: Works offline, syncs when connection returns  
✅ **Real-time Updates**: Changes reflect immediately across devices  
✅ **Error Handling**: Graceful error handling with detailed messages  
✅ **Type Safety**: Full TypeScript support for all operations  

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Security Rules Reference](https://firebase.google.com/docs/firestore/security/get-started)
- [Best Practices](https://firebase.google.com/docs/firestore/best-practices)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Firebase Console logs
3. Check browser console for detailed error messages
4. Verify all environment variables are correctly set
