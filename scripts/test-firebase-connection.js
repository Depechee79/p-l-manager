#!/usr/bin/env node
/**
 * Firebase Connection Test Utility
 * 
 * This script helps you test your Firebase connection and setup
 */

import { initializeFirebase, getFirestoreInstance, isFirebaseConfigured } from './src/config/firebase.config.ts';
import { FirestoreService } from './src/services/FirestoreService.ts';

console.log('\n🔥 Firebase Connection Test\n');
console.log('=' .repeat(50));

// Check configuration
console.log('\n1️⃣  Checking Firebase configuration...');
const isConfigured = isFirebaseConfigured();

if (!isConfigured) {
  console.log('❌ Firebase is NOT configured with real credentials\n');
  console.log('📝 To configure Firebase:');
  console.log('   1. Go to https://console.firebase.google.com');
  console.log('   2. Create a new project or select existing one');
  console.log('   3. Go to Project Settings > General');
  console.log('   4. Scroll down to "Your apps" section');
  console.log('   5. Copy the configuration values');
  console.log('   6. Copy .env.example to .env');
  console.log('   7. Paste your Firebase credentials in .env\n');
  process.exit(1);
}

console.log('✅ Configuration found\n');

// Initialize Firebase
console.log('2️⃣  Initializing Firebase...');
try {
  const app = initializeFirebase();
  console.log(`✅ Firebase initialized: ${app.name}`);
  
  const db = getFirestoreInstance();
  console.log(`✅ Firestore instance created: ${db.type}`);
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error);
  process.exit(1);
}

// Test connection
console.log('\n3️⃣  Testing Firestore connection...');
const firestoreService = new FirestoreService();

try {
  const result = await firestoreService.testConnection();
  
  if (result.success) {
    console.log('✅ Connection successful!');
    console.log('✅ You can now use Firebase in your application');
  } else {
    console.log('❌ Connection failed:', result.error);
    console.log('\n🔍 Common issues:');
    console.log('   - Check your internet connection');
    console.log('   - Verify Firebase credentials in .env');
    console.log('   - Check Firestore security rules in Firebase Console');
    console.log('   - Make sure Firestore is enabled in your project');
  }
} catch (error) {
  console.error('❌ Connection test error:', error);
  process.exit(1);
}

console.log('\n' + '='.repeat(50));
console.log('🎉 Firebase setup verification complete!\n');
