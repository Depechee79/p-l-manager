# REGLA: Modularizacion

---

## Cuando aplica
- Todo proyecto con mas de 10 archivos
- Cuando un archivo supera 200 lineas
- Cuando la estructura se vuelve confusa

---

## Objetivo
Dividir el codigo en modulos pequenos, cohesivos y desacoplados.
Previene: archivos gigantes, dependencias circulares, dificultad de navegacion.

---

## ESTRUCTURA RECOMENDADA

### Por Feature (recomendado para proyectos medianos/grandes)

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   │
│   ├── menu/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── index.ts
│   │
│   └── reservations/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── types/
│       └── index.ts
│
├── shared/
│   ├── components/   # UI reutilizable
│   ├── hooks/        # Hooks genericos
│   ├── utils/        # Utilidades
│   └── types/        # Tipos globales
│
└── pages/            # Solo orquestacion
```

### Por Tipo (proyectos pequenos)

```
src/
├── components/
├── hooks/
├── services/
├── utils/
├── types/
└── pages/
```

---

## HACER (obligatorio)

### Barrel Exports (index.ts)
Cada carpeta de feature debe tener un index.ts que exporta la API publica:

```typescript
// features/menu/index.ts
export { MenuList } from './components/MenuList';
export { useMenu } from './hooks/useMenu';
export { menuService } from './services/menuService';
export type { Menu, MenuItem } from './types';
```

**Importar asi:**
```typescript
import { MenuList, useMenu } from '@/features/menu';
```

**NO asi:**
```typescript
import { MenuList } from '@/features/menu/components/MenuList';
```

### Limites de tamano

| Tipo | Maximo lineas | Accion si excede |
|------|---------------|------------------|
| Componente | 200 | Extraer subcomponentes |
| Page | 250 | Extraer secciones |
| Hook | 200 | Dividir por responsabilidad |
| Service | 250 | Dividir por entidad |
| Utils | 200 | Agrupar por dominio |

### Cohesion alta
Los elementos de un modulo deben estar relacionados:

```
// BIEN: Todo relacionado con menu
features/menu/
├── MenuList.tsx
├── MenuItem.tsx
├── useMenu.ts
└── menuService.ts

// MAL: Mezclado sin relacion
features/misc/
├── MenuList.tsx
├── UserProfile.tsx
├── paymentUtils.ts
└── randomHelpers.ts
```

### Acoplamiento bajo
Un modulo no debe depender de detalles internos de otro:

```typescript
// BIEN: Importar desde API publica
import { useMenu } from '@/features/menu';

// MAL: Importar desde internos
import { useMenuState } from '@/features/menu/hooks/internal/useMenuState';
```

---

## EVITAR (prohibido)

### Dependencias circulares
```
A imports B
B imports C
C imports A  // PROHIBIDO
```

**Solucion:** Extraer dependencia comun a modulo compartido.

### Archivos "junk drawer"
```
// MAL: utils.ts con 50 funciones sin relacion
export const formatDate = ...
export const calculatePrice = ...
export const validateEmail = ...
export const sortArray = ...
```

**Solucion:** Agrupar por dominio:
```
utils/
├── dateUtils.ts
├── priceUtils.ts
├── validationUtils.ts
└── arrayUtils.ts
```

### God Modules
Un modulo que exporta 20+ cosas probablemente necesita dividirse.

---

## CHECKLIST ANTES DE CREAR ARCHIVO NUEVO

| # | Pregunta | Si es SI |
|---|----------|----------|
| 1 | Existe ya algo equivalente? | REUTILIZAR |
| 2 | Puedo resolverlo con props/variantes? | EXTENDER |
| 3 | Puedo extraer de archivo grande? | EXTRAER |
| 4 | Estoy duplicando estilos o tokens? | USAR EXISTENTE |
| 5 | Estoy metiendo logica de datos en UI? | SEPARAR |

**Evidencia obligatoria:**
"Busqueda realizada: [terminos]"
"Resultado: [ruta reutilizada] o [confirmacion inexistencia]"

---

## Verificacion

- [ ] Estructura por feature o por tipo consistente?
- [ ] Cada feature tiene index.ts con exports?
- [ ] Ningun archivo supera limite de lineas?
- [ ] Sin dependencias circulares?
- [ ] Imports desde API publica (index.ts)?
- [ ] Archivos utils agrupados por dominio?

---

## Comandos utiles

```bash
# Buscar archivos grandes
find . -name "*.tsx" -exec wc -l {} + | sort -rn | head -20

# Buscar dependencias circulares (con madge)
npx madge --circular src/

# Buscar imports internos (deberian usar index.ts)
grep -r "from '@/features/.*/" src/
```

---

*Modulos pequenos = codigo mantenible.*
