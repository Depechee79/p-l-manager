# REGLA: React

---

## Cuando aplica
- Componentes React
- Hooks
- Estado y efectos

---

## ESTRUCTURA DE COMPONENTES

```typescript
// Orden dentro de un componente
function MyComponent({ prop1, prop2 }: Props) {
  // 1. Hooks de React (useState, useRef, etc.)
  const [state, setState] = useState(initialState);

  // 2. Hooks custom
  const { data, loading } = useMyHook();

  // 3. Variables derivadas
  const computedValue = useMemo(() => /* ... */, [deps]);

  // 4. Handlers
  const handleClick = useCallback(() => /* ... */, [deps]);

  // 5. Effects
  useEffect(() => { /* ... */ }, [deps]);

  // 6. Early returns
  if (loading) return <Loading />;
  if (!data) return null;

  // 7. Render
  return <div>...</div>;
}
```

---

## HOOKS

```typescript
// useState: estado local simple
const [count, setCount] = useState(0);

// useReducer: estado complejo
const [state, dispatch] = useReducer(reducer, initialState);

// useEffect: side effects
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe(); // Cleanup!
}, [dependency]);

// useMemo: valores computados costosos
const sorted = useMemo(() => items.sort(), [items]);

// useCallback: funciones estables
const handleSubmit = useCallback((data) => {
  onSubmit(data);
}, [onSubmit]);
```

---

## PATRONES

### Container/Presenter

```typescript
// Container: logica
function UserListContainer() {
  const { users, loading } = useUsers();
  const handleDelete = (id: string) => deleteUser(id);

  return <UserList users={users} loading={loading} onDelete={handleDelete} />;
}

// Presenter: UI pura
function UserList({ users, loading, onDelete }: Props) {
  if (loading) return <Spinner />;
  return <ul>{users.map(u => <UserItem key={u.id} user={u} onDelete={onDelete} />)}</ul>;
}
```

### Compound Components

```typescript
// Componentes que trabajan juntos
<Tabs>
  <Tabs.List>
    <Tabs.Tab>Tab 1</Tabs.Tab>
    <Tabs.Tab>Tab 2</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel>Content 1</Tabs.Panel>
  <Tabs.Panel>Content 2</Tabs.Panel>
</Tabs>
```

---

## EVITAR

```typescript
// NO: Estado derivado duplicado
const [items, setItems] = useState([]);
const [count, setCount] = useState(0); // MAL: derivable de items.length

// NO: useEffect para transformar datos
useEffect(() => {
  setFilteredItems(items.filter(i => i.active));
}, [items]); // MAL: usar useMemo

// NO: Dependencias faltantes en hooks
useEffect(() => {
  fetchData(userId); // userId no esta en deps!
}, []); // MAL
```

---

## Verificacion

- [ ] Componentes < 200 lineas?
- [ ] Hooks con dependencias correctas?
- [ ] Sin logica de negocio en componentes UI?
- [ ] Keys unicas en listas?
- [ ] Cleanup en useEffect?

