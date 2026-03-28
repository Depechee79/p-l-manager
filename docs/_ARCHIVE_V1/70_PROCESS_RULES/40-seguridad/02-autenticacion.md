# REGLA: Autenticacion y Autorizacion

---

## Cuando aplica
- Todo sistema con usuarios
- APIs protegidas
- Recursos con control de acceso

---

## Objetivo
Verificar identidad (AuthN) y permisos (AuthZ) correctamente.
Previene: acceso no autorizado, escalacion de privilegios.

---

## CONCEPTOS CLAVE

| Termino | Pregunta | Ejemplo |
|---------|----------|---------|
| **AuthN** (Autenticacion) | Quien eres? | Login con email/password |
| **AuthZ** (Autorizacion) | Que puedes hacer? | Solo admin puede borrar |

```
Usuario → AuthN → "Eres Juan" → AuthZ → "Juan puede ver, no editar"
```

---

## AUTENTICACION (AuthN)

### Usar Firebase Auth (recomendado)

```typescript
// Login
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

async function login(email: string, password: string) {
  const auth = getAuth();
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Verificar sesion
import { onAuthStateChanged } from 'firebase/auth';

function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading };
}
```

### Verificar token en backend

```typescript
// Firebase Admin SDK
import { getAuth } from 'firebase-admin/auth';

async function verifyToken(token: string) {
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new UnauthorizedError('Token invalido');
  }
}

// Middleware de autenticacion
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const user = await verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invalido' });
  }
}
```

---

## AUTORIZACION (AuthZ)

### Sistema de roles

```typescript
// Definir roles
enum Role {
  VIEWER = 'viewer',
  EDITOR = 'editor',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

// Permisos por rol
const PERMISSIONS = {
  [Role.VIEWER]: ['read'],
  [Role.EDITOR]: ['read', 'create', 'update'],
  [Role.MANAGER]: ['read', 'create', 'update', 'delete'],
  [Role.ADMIN]: ['read', 'create', 'update', 'delete', 'manage_users'],
};

// Verificar permiso
function hasPermission(user: User, permission: string): boolean {
  const userPermissions = user.roles.flatMap(role => PERMISSIONS[role] || []);
  return userPermissions.includes(permission);
}

// Uso
function canDeleteOrder(user: User): boolean {
  return hasPermission(user, 'delete');
}
```

### Verificacion de propiedad

```typescript
// Verificar que el recurso pertenece al usuario
async function getOrder(orderId: string, userId: string) {
  const order = await orderRepository.findById(orderId);

  if (!order) {
    throw new NotFoundError('Pedido no encontrado');
  }

  // Verificar propiedad o admin
  const isOwner = order.userId === userId;
  const isAdmin = await hasRole(userId, Role.ADMIN);

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('No tienes acceso a este pedido');
  }

  return order;
}
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Funciones helper
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    function hasRole(role) {
      return request.auth.token.role == role;
    }

    // Pedidos: solo el propietario o admin
    match /orders/{orderId} {
      allow read: if isAuthenticated() &&
        (isOwner(resource.data.userId) || hasRole('admin'));

      allow create: if isAuthenticated() &&
        isOwner(request.resource.data.userId);

      allow update, delete: if isAuthenticated() &&
        (isOwner(resource.data.userId) || hasRole('admin'));
    }

    // Menu: solo managers y admins pueden editar
    match /menu/{itemId} {
      allow read: if true; // Publico
      allow write: if isAuthenticated() &&
        (hasRole('manager') || hasRole('admin'));
    }
  }
}
```

---

## PATRONES DE PROTECCION

### Protected Routes (React)

```typescript
// Componente de ruta protegida
function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !user.roles.includes(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// Uso
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminPanel />
    </ProtectedRoute>
  }
/>
```

### Protected API Endpoints

```typescript
// Decorator o middleware
function requireAuth(handler: Handler) {
  return async (req: Request, res: Response) => {
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    req.user = user;
    return handler(req, res);
  };
}

function requireRole(role: Role) {
  return (handler: Handler) => {
    return async (req: Request, res: Response) => {
      if (!req.user.roles.includes(role)) {
        return res.status(403).json({ error: 'Permisos insuficientes' });
      }
      return handler(req, res);
    };
  };
}

// Uso
export const deleteOrder = requireAuth(requireRole(Role.MANAGER)(
  async (req, res) => {
    await orderService.delete(req.params.id);
    return res.json({ success: true });
  }
));
```

---

## HACER (obligatorio)

- Verificar autenticacion en CADA endpoint protegido
- Verificar autorizacion para cada accion
- Usar Firebase Auth o similar (no implementar propio)
- Implementar Firestore Security Rules
- Verificar propiedad de recursos

---

## EVITAR (prohibido)

- Confiar solo en el frontend para autorizacion
- Asumir que si el usuario esta logueado puede hacer todo
- Exponer IDs de recursos sin verificacion de acceso
- Hardcodear roles en el codigo (usar claims o DB)

---

## Verificacion

- [ ] Todos los endpoints verifican autenticacion?
- [ ] Cada accion verifica permisos?
- [ ] Firestore rules configuradas?
- [ ] Rutas protegidas en frontend?
- [ ] Verificacion de propiedad implementada?

---

*AuthN + AuthZ = Seguridad completa.*
