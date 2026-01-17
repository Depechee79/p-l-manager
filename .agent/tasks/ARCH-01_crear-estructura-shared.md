# 🎯 Tarea ARCH-01: Crear Estructura shared/

**ID**: ARCH-01  \n**Categoría**: Arquitectura  \n**Prioridad**: 🔴 CRÍTICA  \n**Estado**: ✅ COMPLETADA  \n**Fecha inicio**: 2025-12-30  \n**Fecha fin**: 2025-12-30  \n**Dependencias**: Ninguna

---

## 📋 Descripción

Crear la estructura de carpetas `src/shared/` que será la base para todos los componentes, estilos y utilidades reutilizables del proyecto. Esta es la primera tarea porque todas las demás dependen de ella.

---

## 🔍 Auditoría Previa (Estado Actual)

### Estructura actual de `src/`:
```
src/
├── components/     # 21 archivos mezclados (10 componentes + 11 tests)
├── pages/          # 22 archivos (páginas + tests)
├── hooks/          # 14 archivos (hooks + tests)
├── services/       # 21 archivos (servicios + tests)
├── context/        # 4 archivos
├── types/          # 5 archivos
├── utils/          # 9 archivos
├── config/         # 1 archivo
├── test/           # 3 archivos
├── assets/         # (vacío o similar)
├── index.css       # 751 líneas - TODO el CSS junto
├── main.tsx
├── App.tsx
└── vite-env.d.ts
```

### Problemas Identificados

| Problema | Impacto |
|----------|---------|
| Componentes y tests mezclados | Dificulta mantenimiento |
| CSS monolítico (751 líneas) | Dificulta encontrar estilos |
| Sin separación shared vs feature-specific | Duplicación de código |
| Tokens CSS solo en :root | No exportables a JS |

---

## 🎯 Objetivo

Crear estructura preparada para:
1. **Componentes reutilizables** separados de lógica de negocio
2. **Tokens de diseño** accesibles desde CSS y JS
3. **Hooks compartidos** vs hooks específicos de feature
4. **Estilos modulares** vs estilos de página

---

## 📐 Plan de Ejecución

### Paso 1: Crear estructura de carpetas

```
src/shared/
├── components/         # Componentes UI base
│   └── index.ts        # Barrel export
├── hooks/              # Hooks reutilizables
│   └── index.ts
├── styles/             # Estilos globales
│   ├── tokens.css      # Variables CSS
│   ├── reset.css       # Reset/normalización
│   ├── typography.css  # Tipografía
│   ├── components.css  # Estilos de componentes
│   └── index.css       # Import agregado
├── tokens/             # Tokens como constantes JS
│   ├── colors.ts
│   ├── spacing.ts
│   ├── typography.ts
│   └── index.ts
├── types/              # Tipos compartidos
│   └── index.ts
└── utils/              # Utilidades compartidas
    └── index.ts
```

### Paso 2: Crear archivos base con exports vacíos

Cada `index.ts` tendrá exports placeholder para que el build no falle.

### Paso 3: Crear tokens.css base

Extraer las variables de `index.css` a `shared/styles/tokens.css`.

### Paso 4: Crear tokens TypeScript

Duplicar tokens CSS como constantes TypeScript para acceso programático.

### Paso 5: Verificar build y tests

- `npm run build` debe pasar
- `npm test` debe pasar
- La app debe seguir funcionando igual

---

## ✅ Criterios de Aceptación

| # | Criterio | Verificación |
|---|----------|--------------|
| 1 | Carpeta `src/shared/` creada con estructura completa | Visual |
| 2 | Todos los `index.ts` con exports válidos | Build pasa |
| 3 | `tokens.css` con todas las variables CSS extraídas | Visual |
| 4 | Tokens TS exportan mismos valores que CSS | Code review |
| 5 | `npm run build` sin errores | Comando |
| 6 | `npm test` sin nuevos fallos | Comando |
| 7 | App funciona igual en localhost:3000 | Manual |

---

## ⚠️ Riesgos y Mitigación

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Romper imports existentes | Baja | No modificamos imports aún |
| CSS duplicado temporalmente | Aceptable | Se elimina en ARCH-03 |

---

## 📝 Notas

- Esta tarea solo CREA la estructura, no MUEVE archivos existentes
- Los componentes se migrarán en ARCH-02
- El CSS original `index.css` permanece intacto por ahora

---

## 🔄 Post-Ejecución

Tras completar esta tarea:
1. Actualizar estado en BACKLOG.md
2. Documentar cualquier decisión tomada
3. Proceder a ARCH-02 (Migrar componentes)
