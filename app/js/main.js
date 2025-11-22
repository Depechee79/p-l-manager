import { AuthService } from './core/auth-service.js';
import { App } from './app.js';

// Exponer la clase App globalmente
window.App = App;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando Sistema P&L (Modular v2)...');

    const authService = new AuthService();
    const loginOverlay = document.getElementById('loginOverlay');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');

    // 1. Listener de Estado de Autenticación
    authService.initAuthListener((user) => {
        if (user) {
            console.log('🔓 Usuario detectado:', user.email);
            loginOverlay.classList.add('hidden');
            
            // Iniciar App si no existe
            if (!window.app) {
                try {
                    window.app = new App();
                    console.log('✅ P&L Manager App Iniciada y Conectada a Firestore.');
                } catch (err) {
                    console.error("Error fatal iniciando App:", err);
                }
            }
        } else {
            console.log('🔒 No hay usuario. Mostrando Login.');
            loginOverlay.classList.remove('hidden');
            window.app = null; // Limpiar sesión
        }
    });

    // Exponer logout globalmente
    window.logout = () => authService.logout();

    // 2. Manejar el Submit del Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            const btn = loginForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = "Verificando...";
            btn.disabled = true;
            loginError.classList.add('hidden');

            const result = await authService.login(email, password);

            if (!result.success) {
                loginError.textContent = result.error;
                loginError.classList.remove('hidden');
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
});