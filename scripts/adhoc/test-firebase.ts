import { initializeFirebase, getFirestoreInstance } from './src/config/firebase.config';
import { collection, getDocs } from 'firebase/firestore';

// Mock environment variables if needed, or rely on .env loading if running via vite/node
// Since we are running this as a script, we might need to manually set them or check if they are present.
// However, the user's issue is likely that the app is running but not connecting.

console.log("Testing Firebase Connection...");

try {
    const app = initializeFirebase();
    console.log("Firebase App Initialized:", app.name);
    
    const db = getFirestoreInstance();
    console.log("Firestore Instance Gotten");

    // Try to list collections or just read one known collection
    const testCollection = collection(db, 'facturas');
    getDocs(testCollection).then(snapshot => {
        console.log(`Successfully connected! Found ${snapshot.size} documents in 'facturas'.`);
        snapshot.forEach(doc => {
            console.log(doc.id, " => ", doc.data());
        });
    }).catch(err => {
        console.error("Error connecting to Firestore:", err);
    });

} catch (error) {
    console.error("Initialization Error:", error);
}
