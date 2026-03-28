# REGLA: Patrones de Diseno

---

## Cuando aplica
- Al disenar nuevas funcionalidades
- Al refactorizar codigo existente
- Al resolver problemas recurrentes

---

## Objetivo
Usar patrones probados para problemas comunes.
Previene: reinventar la rueda, soluciones fragiles, codigo dificil de mantener.

---

## PATRONES RECOMENDADOS

### 1. Repository Pattern (Acceso a datos)

**Cuando usar:** Siempre que accedas a Firebase, APIs, bases de datos.

```typescript
// repositories/userRepository.ts
export const userRepository = {
  getById: (id: string) => getDoc(doc(db, 'users', id)),
  getAll: () => getDocs(collection(db, 'users')),
  create: (data: User) => addDoc(collection(db, 'users'), data),
  update: (id: string, data: Partial<User>) => updateDoc(doc(db, 'users', id), data),
  delete: (id: string) => deleteDoc(doc(db, 'users', id)),
};
```

**Beneficio:** Centraliza acceso a datos, facil de mockear, cambios en un solo lugar.

---

### 2. Facade Pattern (Simplificar complejidad)

**Cuando usar:** Cuando una operacion requiere multiples pasos.

```typescript
// services/orderService.ts
export const orderService = {
  // Facade que oculta complejidad
  createOrder: async (orderData: OrderInput) => {
    // 1. Validar stock
    await inventoryService.checkStock(orderData.items);
    // 2. Calcular precios
    const totals = pricingService.calculate(orderData);
    // 3. Crear orden
    const order = await orderRepository.create({ ...orderData, ...totals });
    // 4. Notificar
    await notificationService.sendOrderConfirmation(order);
    return order;
  }
};
```

**Beneficio:** El consumidor no necesita conocer los pasos internos.

---

### 3. Factory Pattern (Creacion de objetos)

**Cuando usar:** Cuando necesitas crear objetos con logica compleja.

```typescript
// factories/componentFactory.ts
export function createFormField(type: FieldType, config: FieldConfig) {
  switch (type) {
    case 'text': return new TextField(config);
    case 'number': return new NumberField(config);
    case 'select': return new SelectField(config);
    default: throw new Error(`Unknown field type: ${type}`);
  }
}
```

**Beneficio:** Centraliza logica de creacion, facil de extender.

---

### 4. Observer Pattern (Reactividad)

**Cuando usar:** Cuando multiples partes necesitan reaccionar a cambios.

```typescript
// React Context como Observer
const UserContext = createContext<UserContextType>(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // Todos los componentes hijos reaccionan a cambios
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
```

**Beneficio:** Desacopla emisores de receptores.

---

### 5. Strategy Pattern (Algoritmos intercambiables)

**Cuando usar:** Cuando tienes multiples formas de hacer algo.

```typescript
// strategies/sortStrategy.ts
const sortStrategies = {
  byDate: (items) => items.sort((a, b) => a.date - b.date),
  byName: (items) => items.sort((a, b) => a.name.localeCompare(b.name)),
  byPrice: (items) => items.sort((a, b) => a.price - b.price),
};

function sortItems(items, strategy: keyof typeof sortStrategies) {
  return sortStrategies[strategy](items);
}
```

**Beneficio:** Facil anadir nuevas estrategias sin modificar codigo existente.

---

## ANTI-PATRONES A EVITAR

### God Object
**Que es:** Una clase/componente que hace demasiado.
**Solucion:** Dividir en multiples clases con responsabilidad unica.

### Spaghetti Code
**Que es:** Codigo sin estructura clara, dificil de seguir.
**Solucion:** Aplicar SoC, usar funciones pequenas.

### Copy-Paste Programming
**Que es:** Duplicar codigo en lugar de reutilizar.
**Solucion:** Extraer a funciones, hooks o componentes.

### Magic Numbers/Strings
**Que es:** Valores literales sin explicacion.
**Solucion:** Usar constantes con nombres descriptivos.

```typescript
// Mal
if (status === 3) { ... }

// Bien
const ORDER_STATUS = { PENDING: 1, PROCESSING: 2, COMPLETED: 3 };
if (status === ORDER_STATUS.COMPLETED) { ... }
```

---

## HACER (obligatorio)

- Usar Repository para acceso a datos
- Crear Facades para operaciones complejas
- Aplicar Factory cuando la creacion es compleja
- Usar constantes en lugar de magic numbers
- Documentar el patron usado en comentarios

---

## EVITAR (prohibido)

- God Objects/Components
- Logica duplicada
- Magic numbers/strings
- Acoplamiento directo entre modulos

---

## Verificacion

- [ ] Acceso a datos centralizado en repositories?
- [ ] Operaciones complejas encapsuladas en services?
- [ ] Sin magic numbers/strings?
- [ ] Codigo reutilizable extraido?
- [ ] Patrones documentados cuando no son obvios?

---

*Los patrones son soluciones probadas, no dogmas.*
