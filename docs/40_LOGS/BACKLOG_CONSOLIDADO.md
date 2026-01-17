# 📋 BACKLOG CONSOLIDADO - P&L Manager

**Última actualización**: 2026-01-12  
**Estado**: Activo

> Este documento consolida todos los backlogs en un único lugar de referencia.
> Ver [AUDIT_CONSOLIDADO.md](./AUDIT_CONSOLIDADO.md) para auditorías.

---

## 📊 Resumen General

| Categoría | Total | Completadas | Pendientes |
|-----------|-------|-------------|------------|
| Arquitectura | 8 | 7 | 1 |
| Componentes | 6 | 3 | 3 |
| Páginas | 7 | 5 | 2 |
| Multi-Restaurante | 5 | 2 | 3 |
| Roles/Permisos | 4 | 2 | 2 |
| Testing | 3 | 1 | 2 |
| UX/UI | 5 | 0 | 5 |
| Performance | 3 | 0 | 3 |
| **TOTAL** | **41** | **20** | **21** |

---

## 🔴 PENDIENTES CRÍTICOS

### Componentes Shared
- **COMP-04**: EmptyState
- **COMP-05**: ConfirmModal
- **COMP-06**: DataTable

### Páginas
- **PAGE-03**: Refactorizar ProvidersPage.tsx
- **PAGE-06**: Refactorizar UsersPage.tsx

---

## 🟡 PENDIENTES ALTA PRIORIDAD

### Multi-Restaurante
- **MULTI-01**: Completar RestaurantContext
- **MULTI-02**: Implementar filtro por restaurante
- **MULTI-04**: Implementar transferencias

### Roles/Permisos
- **AUTH-02**: Guard de rutas avanzado
- **AUTH-03**: Autenticación Firebase

### Testing
- **TEST-02**: Tests para nuevos componentes
- **TEST-03**: Tests E2E básicos

---

## 🟢 PENDIENTES MEDIA/BAJA

### UX/UI
- UX-01: Skeleton loaders
- UX-02: Feedback de acciones
- UX-03: Estados de error
- UX-04: Mobile experience
- UX-05: Modo oscuro

### Performance
- PERF-01: Lazy loading
- PERF-02: Bundle size
- PERF-03: Queries Firebase

---

## ✅ ARQUITECTURA (COMPLETADA)

| ID | Tarea | Estado |
|----|-------|--------|
| ARCH-01 | Estructura shared/ | ✅ |
| ARCH-02 | Migrar componentes | ✅ |
| ARCH-03 | Tokens CSS | ✅ |
| ARCH-04 | Layout.tsx | ✅ |
| ARCH-05 | Barrel exports | ✅ |
| ARCH-06 | Path aliases | ✅ |
| ARCH-07 | Features/ | ✅ |
| ARCH-08 | Core/ | ✅ |

---

## ✅ PÁGINAS REFACTORIZADAS

| ID | Página | Líneas Antes | Líneas Después |
|----|--------|--------------|----------------|
| PAGE-01 | OCRPage | 1412 | ~210 |
| PAGE-02 | CierresPage | ~1000 | ~100 |
| PAGE-04 | EscandallosPage | 1110 | ~150 |
| PAGE-05 | InventariosPage | 1040 | ~130 |

---

## 📁 Backlogs Archivados

Los backlogs originales están en:
- [docs/_ARCHIVE/backlogs/](../_ARCHIVE/backlogs/)

---

**Principios de Ejecución**:
1. Una tarea a la vez
2. Calidad sobre velocidad
3. Re-auditar cada cambio
4. Shared-first
