# 🚀 P&L Manager - Roadmap de Migración a Cloud (Firebase)

Este documento rastrea el progreso de la transformación de LocalStorage a Arquitectura Cloud Profesional.

## 🛑 FASE 1: Preparación de Arquitectura (ACTUAL)
- [x] Análisis de dependencias síncronas vs asíncronas.
- [ ] **Refactorización Asíncrona**: Convertir `database.js` para usar Promesas (mocking async) y adaptar `app.js` para usar `async/await`. *Esto es vital antes de instalar Firebase.*
- [ ] **Estandarización de Módulos**: Convertir la carga de scripts en `index.html` a `type="module"` completo para soportar imports modernos.

## 🔐 FASE 2: Identidad y Seguridad
- [ ] Implementar `AuthService` (Servicio de Autenticación).
- [ ] Crear pantalla de Login/Registro.
- [ ] Proteger rutas (nadie entra a la app sin usuario).

## ☁️ FASE 3: Conexión a Firestore
- [ ] Crear `FirestoreService` que replique los métodos de `Database` (add, update, delete, get).
- [ ] Implementar patrón "Repository" para cambiar entre Local y Cloud con un switch.
- [ ] Migración de datos: Script para subir lo que hay en localStorage a Firestore.

## 🎨 FASE 4: Estabilización
- [ ] Verificar OCR con subida de imágenes a Firebase Storage (opcional).
- [ ] Testing de concurrencia (varios usuarios a la vez).
- [ ] Limpieza de código legado.

---
**NOTA TÉCNICA:**
La prioridad absoluta es no romper la funcionalidad actual de OCR y Cierres mientras se construye la infraestructura paralela.