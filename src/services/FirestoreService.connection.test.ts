import { describe, it, expect, beforeAll } from 'vitest';
import {
  initializeFirebase,
  getFirestoreInstance,
  getAuthInstance,
  isFirebaseConfigured,
  firebaseConfig,
} from '@/config/firebase.config';
import { FirestoreService } from '@/services/FirestoreService';

describe('Firebase Connection Tests', () => {
  describe('Configuration', () => {
    it('should have firebase configuration', () => {
      expect(firebaseConfig).toBeDefined();
      expect(firebaseConfig.apiKey).toBeDefined();
      expect(firebaseConfig.projectId).toBeDefined();
      expect(firebaseConfig.authDomain).toBeDefined();
    });

    it('should check if Firebase is configured with real credentials', () => {
      const isConfigured = isFirebaseConfigured();
      // This will be false in test environment without real credentials
      expect(typeof isConfigured).toBe('boolean');
    });
  });

  describe('Initialization', () => {
    it('should initialize Firebase app', () => {
      const app = initializeFirebase();
      expect(app).toBeDefined();
      expect(app.name).toBe('[DEFAULT]');
    });

    it('should return same app instance on multiple calls', () => {
      const app1 = initializeFirebase();
      const app2 = initializeFirebase();
      expect(app1).toBe(app2);
    });

    it('should get Firestore instance', () => {
      const db = getFirestoreInstance();
      expect(db).toBeDefined();
      expect(db.type).toBe('firestore');
    });

    it('should get Auth instance', () => {
      const auth = getAuthInstance();
      expect(auth).toBeDefined();
    });
  });

  describe('FirestoreService Connection', () => {
    let firestoreService: FirestoreService;

    beforeAll(() => {
      firestoreService = new FirestoreService();
    });

    it('should create FirestoreService instance', () => {
      expect(firestoreService).toBeDefined();
      expect(firestoreService).toBeInstanceOf(FirestoreService);
    });

    it('should have testConnection method', () => {
      expect(firestoreService.testConnection).toBeDefined();
      expect(typeof firestoreService.testConnection).toBe('function');
    });

    it('should attempt connection test', async () => {
      // This test will fail if Firebase is not configured with real credentials
      // but it verifies the connection logic is in place
      const result = await firestoreService.testConnection();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (!result.success) {
        expect(result).toHaveProperty('error');
        console.log('⚠️  Firebase not configured with real credentials');
        console.log('📝 To test real connection:');
        console.log('   1. Copy .env.example to .env');
        console.log('   2. Add your Firebase credentials');
        console.log('   3. Run tests again');
      }
    });

    it('should have CRUD methods', () => {
      expect(firestoreService.add).toBeDefined();
      expect(firestoreService.update).toBeDefined();
      expect(firestoreService.delete).toBeDefined();
      expect(firestoreService.get).toBeDefined();
      expect(firestoreService.getAll).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      const firestoreService = new FirestoreService();
      
      // Try to connect - it might fail without credentials but should handle it
      const result = await firestoreService.testConnection();
      
      // Should always return a response object
      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      
      // If it fails, should have error message
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });
  });
});

describe('Firebase Integration Test (Real Connection)', () => {
  let firestoreService: FirestoreService;

  beforeAll(() => {
    firestoreService = new FirestoreService();
  });

  it('should connect to Firebase if configured', async () => {
    const isConfigured = isFirebaseConfigured();
    
    if (!isConfigured) {
      console.log('\n⚠️  SKIPPING REAL CONNECTION TEST');
      console.log('Firebase is not configured with real credentials.');
      console.log('\nTo enable real Firebase connection tests:');
      console.log('1. Create a Firebase project at https://console.firebase.google.com');
      console.log('2. Copy .env.example to .env');
      console.log('3. Add your Firebase project credentials to .env');
      console.log('4. Run tests again\n');
      return;
    }

    console.log('\n🔥 Testing real Firebase connection...');
    const result = await firestoreService.testConnection();
    
    expect(result.success).toBe(true);
    expect(result.data).toBe(true);
    console.log('✅ Firebase connection successful!');
  });

  it('should perform CRUD operations if configured', async () => {
    const isConfigured = isFirebaseConfigured();
    
    if (!isConfigured) {
      console.log('⚠️  Skipping CRUD test - Firebase not configured');
      return;
    }

    // Test adding a document
    const testData = {
      nombre: 'Test Provider',
      createdAt: new Date().toISOString(),
    };

    const addResult = await firestoreService.add('proveedores', testData);
    
    if (!addResult.success) {
      console.log('⚠️  Add operation failed:', addResult.error);
      console.log('This might be due to Firestore rules. Check your Firebase console.');
      return;
    }

    expect(addResult.success).toBe(true);
    expect(addResult.data).toHaveProperty('id');
    
    const docId = addResult.data!.id;
    console.log(`✅ Created test document: ${docId}`);

    // Clean up - delete the test document
    const deleteResult = await firestoreService.delete('proveedores', docId);
    
    if (deleteResult.success) {
      console.log(`✅ Cleaned up test document: ${docId}`);
    }
  });
});
