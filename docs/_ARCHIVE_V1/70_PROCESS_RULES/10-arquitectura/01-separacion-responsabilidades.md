# REGLA: Separacion de Responsabilidades (SoC)

---

## Cuando aplica
- Todo proyecto de software
- Todo componente, modulo o funcion
- Especialmente critico en: UI, servicios, hooks

---

## Objetivo
Cada parte del codigo debe hacer UNA sola cosa bien.
Previene: codigo espagueti, dificultad de testing, cambios en cascada.

---

## HACER (obligatorio)

### Separar capas:
- **UI/Presentacion:** Solo renderiza, recibe props
- **Logica de negocio:** Reglas, calculos, validaciones
- **Acceso a datos:** Llamadas a APIs, Firebase, bases de datos
- **Estado:** Manejo de state, context, stores

### Patron Container/Presenter:
```
Container (Smart)          Presenter (Dumb)
- Maneja estado           - Solo recibe props
- Llama a servicios       - Renderiza UI pura
- Logica de negocio       - Sin side effects
- Pasa datos al Presenter - Reutilizable
```

### Una responsabilidad por archivo:
- 1 componente = 1 archivo
- 1 hook = 1 archivo
- 1 servicio = 1 archivo

---

## EVITAR (prohibido)

- Mezclar fetch de datos con renderizado UI
- Logica de negocio dentro de componentes de UI
- Multiples responsabilidades en un solo archivo
- Componentes "God" que hacen todo

---

## Ejemplos

**Incorrecto:**
```typescript
// UserProfile.tsx - Hace TODO
function UserProfile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch directo en componente
    fetch('/api/user').then(r => r.json()).then(setUser);
  }, []);

  // Logica de negocio mezclada
  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || user?.id === currentUser.id;

  // Renderizado
  return <div>...</div>;
}
```

**Correcto:**
```typescript
// hooks/useUser.ts - Solo datos
function useUser() {
  return useQuery('user', fetchUser);
}

// utils/permissions.ts - Solo logica
function canEditProfile(user, currentUser) {
  return user.role === 'admin' || user.id === currentUser.id;
}

// components/UserProfile.tsx - Solo UI
function UserProfile({ user, canEdit }) {
  return <div>...</div>;
}

// containers/UserProfileContainer.tsx - Orquesta
function UserProfileContainer() {
  const { data: user } = useUser();
  const canEdit = canEditProfile(user, currentUser);
  return <UserProfile user={user} canEdit={canEdit} />;
}
```

---

## Verificacion

- [ ] Cada archivo tiene 1 sola responsabilidad?
- [ ] Los componentes UI no hacen fetch directamente?
- [ ] La logica de negocio esta en servicios/utils?
- [ ] El estado se maneja en hooks o containers?
- [ ] Puedo testear cada parte por separado?

---

## Limites de tamano (referencia)

| Tipo | Maximo lineas |
|------|---------------|
| Componente UI | 200 |
| Page | 250 |
| Hook | 200 |
| Servicio | 250 |

**Si se supera:** Dividir por responsabilidad.

---

*SoC: Separation of Concerns - Cada cosa en su lugar.*
