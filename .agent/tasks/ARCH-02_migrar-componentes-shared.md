# 🎯 Tarea ARCH-02: Migrar Componentes Base a shared/

**ID**: ARCH-02  
**Categoría**: Arquitectura  
**Prioridad**: 🔴 CRÍTICA  
**Estado**: ⏳ En Progreso  
**Fecha inicio**: 2025-12-30  
**Dependencias**: ARCH-01 ✅

---

## 📋 Descripción

Migrar los componentes base de `src/components/` a `src/shared/components/` y actualizar todos los imports en el proyecto para que usen la nueva ubicación.

---

## 🔍 Componentes a Migrar

| # | Componente | Archivo Original | Tiene Test | Líneas |
|---|------------|------------------|------------|--------|
| 1 | Button | Button.tsx | ✅ | ~65 |
| 2 | Card | Card.tsx | ✅ | ~40 |
| 3 | Input | Input.tsx | ✅ | ~135 |
| 4 | Modal | Modal.tsx | ✅ | ~80 |
| 5 | Table | Table.tsx | ✅ | ~120 |
| 6 | Select | Select.tsx | - | ~100 |
| 7 | DatePicker | DatePicker.tsx | - | ~70 |
| 8 | TimePicker | TimePicker.tsx | - | ~70 |
| 9 | FormSection | FormSection.tsx | - | ~30 |
| 10 | StepIndicator | StepIndicator.tsx | - | ~60 |
| 11 | SelectWithAdd | SelectWithAdd.tsx | - | ~100 |

**Excluidos** (no son componentes shared):
- Layout.tsx → Se refactorizará en ARCH-04
- ErrorBoundary.tsx → Se moverá a core/

---

## 📐 Plan de Ejecución

### Paso 1: Crear archivo index.ts con re-exports

En `src/shared/components/index.ts`, actualizar para exportar los componentes migrados.

### Paso 2: Mover componentes uno a uno

Para cada componente:
1. Copiar archivo a `src/shared/components/`
2. Actualizar imports internos (si los hay)
3. Añadir export al index.ts
4. Actualizar imports en archivos que lo usan

### Paso 3: Mover tests junto a componentes

Los tests se mueven con sus componentes.

### Paso 4: Actualizar exports en src/components/index.ts

Mantener re-exports desde la ubicación original para evitar breaking changes.

### Paso 5: Verificación

- Build pasa
- Tests pasan
- App funciona

---

## ✅ Criterios de Aceptación

| # | Criterio |
|---|----------|
| 1 | 11 componentes movidos a `src/shared/components/` |
| 2 | Tests movidos con sus componentes |
| 3 | `npm run build` sin errores |
| 4 | App funciona igual en localhost |
| 5 | Imports actualizados en todo el proyecto |

---

## ⚠️ Estrategia de Migración

**Enfoque conservador**: 
- Mantener re-exports en `src/components/index.ts` apuntando a `shared/`
- Así los imports existentes siguen funcionando
- Gradualmente migrar imports a `@/shared/components` en tareas futuras

---

## Checklist de Ejecución

- [ ] Button.tsx → shared/components/
- [ ] Card.tsx → shared/components/
- [ ] Input.tsx → shared/components/
- [ ] Modal.tsx → shared/components/
- [ ] Table.tsx → shared/components/
- [ ] Select.tsx → shared/components/
- [ ] DatePicker.tsx → shared/components/
- [ ] TimePicker.tsx → shared/components/
- [ ] FormSection.tsx → shared/components/
- [ ] StepIndicator.tsx → shared/components/
- [ ] SelectWithAdd.tsx → shared/components/
- [ ] Actualizar shared/components/index.ts
- [ ] Actualizar src/components/index.ts con re-exports
- [ ] Verificar build
- [ ] Verificar app
