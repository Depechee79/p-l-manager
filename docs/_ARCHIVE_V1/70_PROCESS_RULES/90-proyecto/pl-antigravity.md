# PROJECT RULES: P&L Antigravity Manager

> **Proyecto**: Sistema P&L para restaurantes
> **Última actualización**: Enero 2026

---

## STACK CONFIRMADO

- React 18 + TypeScript estricto + Vite
- Firebase (Auth, Firestore)
- TailwindCSS + Tokens CSS centralizados
- **NO introducir**: Next, Remix, MUI, Chakra sin aprobación

---

## ARQUITECTURA REAL

```
src/
├── shared/                 # NÚCLEO DEL SISTEMA DE DISEÑO
│   ├── components/         # Componentes UI reutilizables
│   ├── tokens/             # Tokens de diseño (TS + CSS)
│   ├── styles/             # Estilos base
│   ├── hooks/              # Hooks genéricos
│   └── index.ts            # Barrel export principal
├── core/                   # Servicios base e infraestructura
│   ├── services/           # DatabaseService, ItemsService
│   └── context/            # Contextos globales
├── features/               # Funcionalidad por dominio
├── pages/                  # Páginas de la aplicación
├── hooks/                  # Hooks de dominio
├── types/                  # Tipos de dominio
└── config/                 # Configuración Firebase
```

---

## REGLAS OBLIGATORIAS DEL PROYECTO

### R-01: Componentes en `shared/`
Todo componente UI reutilizable DEBE ir en `src/shared/components/`

### R-02: Usar Tokens
```css
/* BIEN */
color: var(--text-main);
padding: var(--spacing-md);

/* MAL */
color: #111827;
padding: 20px;
```

### R-03: Barrel Exports
Cada carpeta con múltiples archivos DEBE tener `index.ts`

### R-04: Imports por Alias
```typescript
// BIEN
import { Button } from '@shared/components';
import { useFinance } from '@hooks';

// MAL
import { Button } from '../../../shared/components/Button';
```

### R-05: Sin Modificar `shared/` sin Auditoría
Antes de modificar cualquier componente en `shared/`:
1. Verificar qué páginas/componentes lo usan
2. Documentar el cambio propuesto
3. Verificar que no rompe otros usos

---

## REGLAS FINANCIERAS

- Formatear moneda con `Intl.NumberFormat`
- Almacenar valores en Firestore como numbers
- KPIs con umbrales de hostelería:
  - Food Cost: <30% verde, 30-35% ámbar, >35% rojo
  - Labor Cost: <25% verde, 25-30% ámbar, >30% rojo
  - Prime Cost: <60% verde, 60-65% ámbar, >65% rojo

---

## R-12: BUSCAR TODOS LOS CASOS

Cuando el usuario reporta un problema con un ejemplo:
1. Usar búsqueda para encontrar TODAS las ocurrencias
2. Listar todos los archivos afectados
3. NO arreglar solo el ejemplo aislado

---

## R-13: COHERENCIA ABSOLUTA

La coherencia NO se logra con dimensiones fijas, sino usando los **mismos contenedores** en toda la app.

| Nivel | Qué Cubre |
|-------|-----------|
| VISUAL | Misma apariencia |
| ESTRUCTURAL | Mismos contenedores |
| CÓDIGO | Mismos patrones |

---

## COMANDOS

```bash
npm run dev      # Desarrollo
npm run build    # Build
npm test         # Tests
npm run lint     # Lint
```

---

## DOCUMENTACIÓN

| Documento | Ubicación |
|-----------|-----------|
| Reglas arquitectura | `docs/01_CANON/RULES.md` |
| Handoff | `docs/01_CANON/HANDOFF.md` |
| Tokens | `docs/01_CANON/TOKENS_REFERENCE.md` |
| Backlog | `docs/40_LOGS/BACKLOG_CONSOLIDADO.md` |

---

*Consultar `docs/00_INDEX.md` para índice completo.*
