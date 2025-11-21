import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

export class AuthService {
    constructor() {
        this.user = null;
    }

    /**
     * Iniciar sesión con Email y Contraseña
     */
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            this.user = userCredential.user;
            console.log("✅ Usuario logueado:", this.user.email);
            return { success: true, user: this.user };
        } catch (error) {
            console.error("❌ Error de login:", error.code, error.message);
            let mensaje = "Error al iniciar sesión.";
            if (error.code === 'auth/invalid-credential') mensaje = "Credenciales incorrectas.";
            if (error.code === 'auth/too-many-requests') mensaje = "Demasiados intentos. Intenta más tarde.";
            return { success: false, error: mensaje };
        }
    }

    /**
     * Cerrar sesión
     */
    async logout() {
        try {
            await signOut(auth);
            console.log("👋 Sesión cerrada");
            return { success: true };
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Observador de estado (Se ejecuta cuando cambia el usuario)
     */
    initAuthListener(callback) {
        onAuthStateChanged(auth, (user) => {
            this.user = user;
            callback(user);
        });
    }
}