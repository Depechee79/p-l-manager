# REGLA: Documentacion

---

## Cuando aplica
- Codigo complejo o no obvio
- APIs publicas
- Decisiones arquitectonicas
- Onboarding de nuevos miembros

---

## Objetivo
Documentar lo necesario, ni mas ni menos.
Previene: confusion, tiempo perdido, conocimiento perdido.

---

## PRINCIPIO FUNDAMENTAL

> **El mejor codigo es autodocumentado.**
> Documentar el "por que", no el "que".

```typescript
// MAL: Documenta lo obvio
// Incrementa el contador en 1
counter++;

// BIEN: Documenta el por que
// Usamos contador local porque el global tiene race conditions en concurrencia
const localCounter = useRef(0);
```

---

## NIVELES DE DOCUMENTACION

### 1. Codigo autodocumentado

```typescript
// MAL: Necesita comentario
const d = new Date().getTime() - u.c; // Calcula edad

// BIEN: Nombre descriptivo
const userAgeInMilliseconds = Date.now() - user.createdAt;

// MAL: Logica confusa
if (s === 1 || s === 3 || s === 5) { ... }

// BIEN: Nombres claros
const isActiveStatus = [Status.PENDING, Status.PROCESSING, Status.SHIPPED].includes(status);
if (isActiveStatus) { ... }
```

### 2. Comentarios en codigo

**Cuando usar:**
- Explicar decisiones no obvias
- Advertir de comportamientos inesperados
- TODOs con contexto
- Workarounds temporales

```typescript
// BIEN: Explica decision
// Usamos debounce de 300ms porque la API tiene rate limit de 10/s
const debouncedSearch = useDebouncedCallback(search, 300);

// BIEN: Advierte
// WARNING: Este calculo asume precios en EUR. Para otras monedas, usar convertPrice()
const total = items.reduce((sum, item) => sum + item.price, 0);

// BIEN: TODO con contexto
// TODO(jira-123): Extraer a hook cuando tengamos mas de 3 usos similares

// BIEN: Workaround documentado
// HACK: Firebase SDK no exporta este tipo, lo recreamos manualmente
// Relacionado: https://github.com/firebase/firebase-js-sdk/issues/1234
interface FirestoreTimestamp { ... }
```

### 3. JSDoc/TSDoc (APIs publicas)

```typescript
/**
 * Calcula el total de un pedido aplicando descuentos.
 *
 * @param items - Lista de items del pedido
 * @param discountCode - Codigo de descuento opcional
 * @returns Total calculado con descuentos aplicados
 *
 * @example
 * ```ts
 * const total = calculateOrderTotal(
 *   [{ price: 10 }, { price: 20 }],
 *   'SAVE10'
 * );
 * // total = 27 (10% descuento)
 * ```
 *
 * @throws {InvalidDiscountError} Si el codigo de descuento no es valido
 */
function calculateOrderTotal(
  items: OrderItem[],
  discountCode?: string
): number {
  // ...
}
```

### 4. README del proyecto

```markdown
# Nombre del Proyecto

Descripcion breve de que hace el proyecto.

## Quick Start

\`\`\`bash
npm install
npm run dev
\`\`\`

## Estructura

\`\`\`
src/
├── features/    # Modulos de negocio
├── shared/      # Codigo compartido
└── pages/       # Rutas
\`\`\`

## Scripts

| Script | Descripcion |
|--------|-------------|
| `npm run dev` | Desarrollo local |
| `npm run build` | Build de produccion |
| `npm run test` | Ejecutar tests |

## Variables de entorno

Copiar `.env.example` a `.env.local` y configurar.

## Deployment

[Instrucciones de deployment]
```

### 5. Architecture Decision Records (ADRs)

```markdown
# ADR-001: Usar Firebase para autenticacion

## Contexto
Necesitamos autenticacion de usuarios con soporte para Google, email y telefono.

## Decision
Usaremos Firebase Authentication.

## Alternativas consideradas
1. **Auth0** - Mas features pero mas caro y complejo
2. **Custom JWT** - Control total pero mas trabajo
3. **Firebase Auth** - Balance entre features y simplicidad

## Consecuencias

### Positivas
- Integracion directa con Firestore
- SDK bien mantenido
- Gratis hasta 50k usuarios/mes

### Negativas
- Vendor lock-in con Google
- Menos control sobre flujos custom

## Estado
Aceptado (2024-01-15)
```

---

## QUE DOCUMENTAR

### SIEMPRE documentar:
- Decisiones arquitectonicas (ADRs)
- APIs publicas (JSDoc)
- Configuracion del proyecto (README)
- Workarounds y hacks
- Comportamientos no obvios

### A VECES documentar:
- Logica de negocio compleja
- Algoritmos no triviales
- Integraciones con terceros

### NUNCA documentar:
- Codigo obvio
- Getters/setters simples
- Reimplementaciones de librerias

---

## ANTI-PATRONES

### Comentarios obsoletos
```typescript
// MAL: Comentario que ya no aplica
// Calcula descuento del 10%
function calculateDiscount(price) {
  return price * 0.15; // Ahora es 15% pero el comentario dice 10%!
}
```

### Comentarios obvios
```typescript
// MAL: No aporta nada
// Funcion que obtiene el usuario
function getUser() { ... }

// Incrementar contador
i++;
```

### Documentacion duplicada
```typescript
// MAL: JSDoc que repite el nombre
/**
 * Gets the user by ID.
 * @param id - The ID.
 * @returns The user.
 */
function getUserById(id: string): User { ... }

// BIEN: Solo si aporta algo
/**
 * @param id - Firebase Auth UID (no el ID interno de Firestore)
 * @throws {NotFoundError} Si el usuario no existe
 */
function getUserById(id: string): User { ... }
```

---

## HACER (obligatorio)

- Nombres descriptivos en vez de comentarios
- Documentar decisiones arquitectonicas (ADRs)
- README actualizado con setup
- JSDoc en funciones publicas/exportadas
- Eliminar comentarios obsoletos

---

## EVITAR (prohibido)

- Comentarios obvios que repiten el codigo
- Documentacion que no se mantiene
- READMEs desactualizados
- TODOs sin contexto ni ticket

---

## Verificacion

- [ ] Codigo es legible sin comentarios?
- [ ] APIs publicas tienen JSDoc?
- [ ] README permite setup en < 10 min?
- [ ] Decisiones arquitectonicas documentadas?
- [ ] Sin comentarios obsoletos?

---

*Documenta el por que, no el que.*
