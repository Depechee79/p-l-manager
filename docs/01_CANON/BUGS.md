# 🐛 Bugs Preexistentes Descubiertos

**Fecha descubrimiento**: 2025-12-30  
**Descubierto durante**: Auditoría ARCH-01

---

## 🔴 CRÍTICOS (Bloquean la aplicación)

### BUG-001: Calculator no definido en DashboardPage
- **Estado**: ✅ RESUELTO (2025-12-30)
- **Archivo**: `src/pages/DashboardPage.tsx`
- **Solución**: Limpieza de imports y estandarización a lucide-react.

### BUG-002: Permisos Firebase insuficientes
- **Error**: `FirebaseError: Missing or insufficient permissions`
- **Colecciones afectadas**: `mermas`, `orders`
- **Impacto**: Datos no cargan desde Firebase
- **Causa probable**: Reglas de seguridad de Firestore

---

## 🟠 Build Errors (132 errores en 43 archivos)

### Categorías de errores encontrados:

| Categoría | Archivos | Cantidad | Descripción |
|-----------|----------|----------|-------------|
| TS6133 | Varios | ~20 | Variables declaradas pero no usadas |
| TS2551 | RestaurantService | ~5 | Propiedades no existen en tipos |
| TS2554 | migration.ts | ~9 | Argumentos incorrectos |
| TS2345 | Varios | ~30 | Tipos incompatibles |

### Archivos más afectados:
1. `src/pages/DashboardPage.tsx` - 22 errores
2. `src/services/FinanceService.test.ts` - 14 errores
3. `src/pages/UsersPage.tsx` - 9 errores
4. `src/pages/PnLPage.tsx` - 9 errores
5. `src/utils/migration.ts` - 9 errores

---

## 📋 Plan de Resolución

Estos bugs se añaden como tareas con prioridad CRÍTICA antes de continuar con la arquitectura:

| ID | Bug | Prioridad | Estado |
|----|-----|-----------|--------|
| FIX-001 | Calculator not defined | 🔴 CRÍTICA | ✅ RESUELTO |
| FIX-002 | Firebase permissions | 🔴 CRÍTICA | ⬜ Pendiente |
| FIX-003 | Build errors (132) | 🟠 ALTA | 🟡 EN PROGRESO |

---

## ⚠️ Decisión Requerida

El código base tiene problemas serios que impiden su funcionamiento. Antes de continuar con la arquitectura (ARCH-02), se recomienda:

**Opción A**: Arreglar los bugs críticos primero (FIX-001, FIX-002)
**Opción B**: Continuar con arquitectura y arreglar bugs después

---

**Nota**: La estructura `shared/` creada en ARCH-01 no es la causa de estos errores. Son problemas preexistentes del código original.
