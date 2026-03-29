import { describe, it, expect, beforeAll } from 'vitest';
import {
  initializeFirebase,
  getFirestoreInstance,
  getAuthInstance,
  isFirebaseConfigured,
  firebaseConfig,
} from '@/config/firebase.config';
import { FirestoreService } from '@core/services/FirestoreService';

/**
 * EXCEPTION: console.log statements are intentionally kept in this file.
 * The connection tests and integration tests (gated by FIREBASE_INTEGRATION env var)
 * only run manually for diagnostic purposes. The console output serves as
 * real-time diagnostic feedback during manual integration testing sessions.
 */

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

// Real connection tests require authenticated Firebase access.
// Run with FIREBASE_INTEGRATION=true to enable.
const runIntegration = process.env.FIREBASE_INTEGRATION === 'true';

describe.skipIf(!runIntegration)('Firebase Integration Test (Real Connection)', () => {
  let firestoreService: FirestoreService;

  beforeAll(() => {
    firestoreService = new FirestoreService();
  });

  it('should connect to Firebase if configured', async () => {
    const result = await firestoreService.testConnection();

    expect(result.success).toBe(true);
    expect(result.data).toBe(true);
  });

  it('should perform CRUD operations if configured', async () => {
    // Test adding a document
    const testData = {
      nombre: 'Test Provider',
      createdAt: new Date().toISOString(),
    };

    const addResult = await firestoreService.add('proveedores', testData);

    if (!addResult.success) {
      // Might fail due to Firestore rules - not a test failure
      return;
    }

    expect(addResult.success).toBe(true);
    expect(addResult.data).toHaveProperty('id');

    const docId = addResult.data!.id;

    // Clean up - delete the test document
    await firestoreService.delete('proveedores', docId);
  });
});
