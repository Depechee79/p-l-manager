# REGLA: Control de Complejidad

---

## Cuando aplica
- Al escribir funciones, metodos, componentes
- Al revisar codigo existente
- Al detectar dificultad para entender el codigo

---

## Objetivo
Mantener el codigo simple, legible y mantenible.
Previene: bugs ocultos, dificultad de testing, onboarding lento.

---

## METRICAS DE COMPLEJIDAD

### Complejidad Ciclomatica
Numero de caminos independientes en el codigo.

| Nivel | Valor | Accion |
|-------|-------|--------|
| Bajo | 1-5 | OK |
| Moderado | 6-10 | Considerar simplificar |
| Alto | 11-20 | Refactorizar obligatorio |
| Muy alto | 20+ | PROHIBIDO - Dividir inmediatamente |

**Cada uno de estos aumenta +1:**
- `if`, `else if`
- `for`, `while`, `do-while`
- `case` (en switch)
- `&&`, `||` (en condiciones)
- `catch`
- `?:` (ternario)

### Profundidad de Anidacion
Niveles de indentacion.

| Nivel | Accion |
|-------|--------|
| 1-2 | OK |
| 3 | Considerar extraer |
| 4+ | Refactorizar obligatorio |

---

## TECNICAS DE SIMPLIFICACION

### 1. Early Return (Clausulas de Guarda)

**Antes (anidado):**
```typescript
function processOrder(order) {
  if (order) {
    if (order.items.length > 0) {
      if (order.status === 'pending') {
        // Logica principal
        return calculateTotal(order);
      } else {
        return null;
      }
    } else {
      return null;
    }
  } else {
    return null;
  }
}
```

**Despues (early return):**
```typescript
function processOrder(order) {
  if (!order) return null;
  if (order.items.length === 0) return null;
  if (order.status !== 'pending') return null;

  // Logica principal - sin anidacion
  return calculateTotal(order);
}
```

### 2. Extraer Funciones

**Antes (funcion larga):**
```typescript
function handleSubmit(data) {
  // 20 lineas de validacion
  // 15 lineas de transformacion
  // 10 lineas de llamada API
  // 15 lineas de manejo de respuesta
}
```

**Despues (funciones pequenas):**
```typescript
function handleSubmit(data) {
  const validationErrors = validateFormData(data);
  if (validationErrors.length > 0) return handleErrors(validationErrors);

  const payload = transformToApiPayload(data);
  const response = await submitToApi(payload);

  return handleApiResponse(response);
}
```

### 3. Reemplazar Condicionales con Polimorfismo/Mapas

**Antes (switch largo):**
```typescript
function getDiscount(userType) {
  switch (userType) {
    case 'basic': return 0;
    case 'premium': return 10;
    case 'vip': return 20;
    case 'employee': return 30;
    default: return 0;
  }
}
```

**Despues (mapa):**
```typescript
const DISCOUNTS = {
  basic: 0,
  premium: 10,
  vip: 20,
  employee: 30,
};

function getDiscount(userType) {
  return DISCOUNTS[userType] ?? 0;
}
```

### 4. Usar Funciones de Array

**Antes (loops imperativos):**
```typescript
const activeUsers = [];
for (let i = 0; i < users.length; i++) {
  if (users[i].status === 'active') {
    activeUsers.push({
      id: users[i].id,
      name: users[i].name
    });
  }
}
```

**Despues (funcional):**
```typescript
const activeUsers = users
  .filter(user => user.status === 'active')
  .map(({ id, name }) => ({ id, name }));
```

### 5. Descomponer Condiciones Complejas

**Antes:**
```typescript
if (user.age >= 18 && user.country === 'ES' && user.verified && !user.banned && user.subscription !== 'cancelled') {
  // ...
}
```

**Despues:**
```typescript
const isAdult = user.age >= 18;
const isFromSpain = user.country === 'ES';
const isVerified = user.verified;
const isNotBanned = !user.banned;
const hasActiveSubscription = user.subscription !== 'cancelled';

const canAccess = isAdult && isFromSpain && isVerified && isNotBanned && hasActiveSubscription;

if (canAccess) {
  // ...
}
```

---

## LIMITES RECOMENDADOS

| Metrica | Limite |
|---------|--------|
| Lineas por funcion | 30 max |
| Parametros por funcion | 4 max |
| Profundidad de anidacion | 3 max |
| Complejidad ciclomatica | 10 max |
| Lineas por archivo | 200-250 max |

---

## HACER (obligatorio)

- Aplicar early return para reducir anidacion
- Extraer funciones cuando superen 30 lineas
- Nombrar condiciones complejas con variables descriptivas
- Preferir map/filter/reduce sobre loops
- Usar objetos/mapas en lugar de switches largos

---

## EVITAR (prohibido)

- Funciones de mas de 50 lineas
- Mas de 3 niveles de anidacion
- Condiciones con mas de 3 operadores sin nombrar
- Switch con mas de 5 cases (usar mapa)
- Parametros con mas de 4 argumentos (usar objeto)

---

## Verificacion

- [ ] Ninguna funcion supera 30 lineas?
- [ ] Anidacion maxima de 3 niveles?
- [ ] Condiciones complejas nombradas?
- [ ] Early returns aplicados?
- [ ] Sin switches largos (usar mapas)?
- [ ] Parametros <= 4 o usando objeto de config?

---

*Codigo simple = codigo mantenible.*
