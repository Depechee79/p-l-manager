// Importar funciones necesarias de los SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Configuración de tu Web App
const firebaseConfig = {
  apiKey: "AIzaSyAu6FD2uSJGUX1lAH9w15OXdTleMmro7Cg",
  authDomain: "pylhospitality.firebaseapp.com",
  projectId: "pylhospitality",
  storageBucket: "pylhospitality.firebasestorage.app",
  messagingSenderId: "452181527860",
  appId: "1:452181527860:web:285e0cf78dc98bbaa92961",
  measurementId: "G-9EM6MYHHGK"
};

// Inicializar Firebase (Singleton)
let app;
let analytics;
let db;
let auth;

try {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("🔥 Firebase inicializado correctamente (Modo Pasivo)");
} catch (error) {
    console.error("Error inicializando Firebase:", error);
}

// Exportar instancias para uso en módulos
export { app, db, auth };