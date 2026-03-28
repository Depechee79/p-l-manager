# REGLA: OWASP Top 10 - Seguridad Web

---

## Cuando aplica
- Todo codigo que maneja datos de usuarios
- APIs y endpoints
- Formularios y inputs
- Autenticacion y autorizacion

---

## Objetivo
Prevenir las vulnerabilidades mas comunes de seguridad web.
Previene: brechas de datos, acceso no autorizado, ataques.

---

## OWASP TOP 10 (2021)

### A01: Broken Access Control

**Riesgo:** Usuarios acceden a recursos que no deberian.

**HACER:**
```typescript
// Verificar permisos en CADA endpoint
async function getOrder(orderId: string, userId: string) {
  const order = await orderRepository.findById(orderId);

  // Verificar propiedad
  if (order.userId !== userId) {
    throw new ForbiddenError('No tienes acceso a este pedido');
  }

  return order;
}

// Usar roles y permisos
function canUserEditMenu(user: User): boolean {
  return user.roles.includes('admin') || user.roles.includes('manager');
}
```

**EVITAR:**
```typescript
// MAL: Sin verificacion de acceso
async function getOrder(orderId: string) {
  return orderRepository.findById(orderId); // Cualquiera puede ver cualquier orden!
}
```

---

### A02: Cryptographic Failures

**Riesgo:** Datos sensibles expuestos por cifrado debil o ausente.

**HACER:**
- Usar HTTPS siempre
- Cifrar datos sensibles en reposo
- Usar algoritmos modernos (bcrypt para passwords)
- No almacenar datos sensibles innecesarios

```typescript
// Hashear passwords con bcrypt
import bcrypt from 'bcrypt';

async function hashPassword(password: string): Promise<string> {
  const SALT_ROUNDS = 12;
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**EVITAR:**
```typescript
// MAL: Password en texto plano
user.password = inputPassword;

// MAL: Algoritmo debil
const hash = md5(password); // MD5 es inseguro!
```

---

### A03: Injection

**Riesgo:** Codigo malicioso inyectado via inputs.

**HACER:**
```typescript
// Usar queries parametrizadas (Firestore lo hace automatico)
const users = await db
  .collection('users')
  .where('email', '==', email) // Parametrizado
  .get();

// Validar y sanitizar inputs
import { z } from 'zod';

const UserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

function createUser(input: unknown) {
  const validated = UserInputSchema.parse(input); // Valida y sanitiza
  // ...
}
```

**EVITAR:**
```typescript
// MAL: Concatenacion de strings (SQL injection)
const query = `SELECT * FROM users WHERE email = '${email}'`;

// MAL: Eval de input del usuario
eval(userInput); // NUNCA!
```

---

### A04: Insecure Design

**Riesgo:** Fallas de diseno que no pueden arreglarse con codigo.

**HACER:**
- Disenar con seguridad desde el inicio
- Modelar amenazas antes de implementar
- Limitar intentos de login
- Rate limiting en APIs

```typescript
// Rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Max 100 requests por ventana
  message: 'Demasiadas peticiones, intenta mas tarde',
});

// Limite de intentos de login
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 min

async function attemptLogin(email: string, password: string) {
  const attempts = await getLoginAttempts(email);

  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    throw new TooManyAttemptsError('Cuenta bloqueada temporalmente');
  }
  // ...
}
```

---

### A05: Security Misconfiguration

**Riesgo:** Configuraciones por defecto inseguras.

**HACER:**
- Deshabilitar features innecesarias
- Configurar headers de seguridad
- No exponer errores detallados en produccion
- Mantener dependencias actualizadas

```typescript
// Headers de seguridad (Next.js)
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

// Errores genericos en produccion
function handleError(error: Error) {
  if (process.env.NODE_ENV === 'production') {
    return { error: 'Ha ocurrido un error' }; // No exponer detalles
  }
  return { error: error.message, stack: error.stack };
}
```

---

### A06: Vulnerable Components

**Riesgo:** Usar librerias con vulnerabilidades conocidas.

**HACER:**
```bash
# Auditar dependencias regularmente
npm audit

# Actualizar dependencias
npm update

# Usar herramientas automaticas
# Dependabot, Snyk, etc.
```

**EVITAR:**
- Ignorar warnings de `npm audit`
- Usar versiones muy antiguas de librerias
- Dependencias abandonadas (sin updates en 2+ anos)

---

### A07: Authentication Failures

**Riesgo:** Fallas en autenticacion permiten acceso no autorizado.

**HACER:**
```typescript
// Usar Firebase Auth (bien implementado)
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Verificar token en cada request
async function verifyAuth(req: Request) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) throw new UnauthorizedError('Token requerido');

  const decodedToken = await admin.auth().verifyIdToken(token);
  return decodedToken;
}

// Passwords fuertes
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};
```

---

### A08: Software Integrity Failures

**Riesgo:** Codigo o datos modificados sin verificacion.

**HACER:**
- Verificar integridad de dependencias (package-lock.json)
- Usar SRI (Subresource Integrity) para scripts externos
- Firmar commits (GPG)

```html
<!-- SRI para scripts externos -->
<script
  src="https://cdn.example.com/lib.js"
  integrity="sha384-abc123..."
  crossorigin="anonymous"
></script>
```

---

### A09: Security Logging Failures

**Riesgo:** No detectar ataques por falta de logs.

**HACER:**
```typescript
// Loggear eventos de seguridad
const securityLogger = {
  loginAttempt: (email: string, success: boolean, ip: string) => {
    logger.info('LOGIN_ATTEMPT', { email, success, ip, timestamp: Date.now() });
  },

  accessDenied: (userId: string, resource: string) => {
    logger.warn('ACCESS_DENIED', { userId, resource, timestamp: Date.now() });
  },

  suspiciousActivity: (details: object) => {
    logger.error('SUSPICIOUS_ACTIVITY', { ...details, timestamp: Date.now() });
  },
};
```

**NO loggear:**
- Passwords
- Tokens
- Datos sensibles de usuarios

---

### A10: Server-Side Request Forgery (SSRF)

**Riesgo:** Servidor hace requests a URLs controladas por atacante.

**HACER:**
```typescript
// Validar URLs antes de fetch
const ALLOWED_DOMAINS = ['api.trusted.com', 'cdn.trusted.com'];

function isUrlAllowed(url: string): boolean {
  const parsed = new URL(url);
  return ALLOWED_DOMAINS.includes(parsed.hostname);
}

async function fetchExternal(url: string) {
  if (!isUrlAllowed(url)) {
    throw new Error('URL no permitida');
  }
  return fetch(url);
}
```

---

## CHECKLIST DE SEGURIDAD

- [ ] Verifico permisos en cada endpoint?
- [ ] Passwords hasheados con bcrypt?
- [ ] Inputs validados y sanitizados?
- [ ] Rate limiting implementado?
- [ ] Headers de seguridad configurados?
- [ ] Dependencias auditadas?
- [ ] Eventos de seguridad loggeados?
- [ ] HTTPS forzado?
- [ ] Secretos en variables de entorno?

---

*La seguridad no es opcional.*
