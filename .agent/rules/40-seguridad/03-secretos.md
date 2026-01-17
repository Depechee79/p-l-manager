# REGLA: Gestion de Secretos

---

## Cuando aplica
- API keys, tokens, passwords
- Credenciales de servicios
- Variables de entorno sensibles

---

## Objetivo
Mantener secretos seguros y fuera del codigo.
Previene: filtraciones de credenciales, acceso no autorizado.

---

## REGLAS FUNDAMENTALES

### 1. NUNCA en codigo
```typescript
// MAL: Secreto hardcodeado
const API_KEY = 'sk_live_abc123xyz789';
const DATABASE_URL = 'postgresql://user:password@host:5432/db';

// BIEN: Variable de entorno
const API_KEY = process.env.API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;
```

### 2. NUNCA en repositorio
```bash
# .gitignore - OBLIGATORIO
.env
.env.local
.env.*.local
*.pem
*.key
service-account*.json
firebase-adminsdk*.json
```

### 3. NUNCA en logs
```typescript
// MAL: Loggear secretos
console.log('Conectando con API key:', apiKey);
logger.info({ config: { apiKey, dbPassword } });

// BIEN: Ocultar en logs
console.log('Conectando con API key:', apiKey.slice(0, 4) + '****');
logger.info({ config: { apiKey: '[REDACTED]' } });
```

### 4. NUNCA en frontend
```typescript
// MAL: Secreto expuesto en cliente
const stripe = new Stripe('sk_live_secretkey'); // Secret key en cliente!

// BIEN: Solo public keys en cliente
const stripe = new Stripe('pk_live_publickey'); // Public key OK

// El secret key va en el servidor
// pages/api/payment.ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
```

---

## TIPOS DE SECRETOS

| Tipo | Ejemplo | Donde guardar |
|------|---------|---------------|
| API Keys (secret) | Stripe secret key | .env servidor |
| API Keys (public) | Firebase config | .env cliente |
| Passwords BD | PostgreSQL password | .env servidor |
| Service accounts | Firebase Admin SDK | .env o secret manager |
| JWT secrets | Token signing key | .env servidor |
| OAuth secrets | Google client secret | .env servidor |

---

## CONFIGURACION POR ENTORNO

### Estructura de archivos .env

```
proyecto/
├── .env                  # Defaults (sin secretos)
├── .env.local            # Desarrollo local (gitignored)
├── .env.development      # Desarrollo
├── .env.production       # Produccion (gitignored o en CI)
└── .env.example          # Template para el equipo
```

### .env.example (commitear)
```bash
# .env.example - Template para configuracion
# Copiar a .env.local y rellenar valores

# Firebase (cliente - ok exponer)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=

# Firebase Admin (servidor - SECRETO)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Base de datos
DATABASE_URL=
```

### Acceso en codigo

```typescript
// Cliente (Next.js)
// Solo NEXT_PUBLIC_* estan disponibles
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
};

// Servidor (API routes, Cloud Functions)
// Todas las variables disponibles
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
```

---

## VALIDACION DE SECRETOS

```typescript
// utils/env.ts
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

// Configuracion validada
export const config = {
  stripe: {
    secretKey: getRequiredEnv('STRIPE_SECRET_KEY'),
    publishableKey: getRequiredEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
  },
  firebase: {
    projectId: getRequiredEnv('FIREBASE_ADMIN_PROJECT_ID'),
    privateKey: getRequiredEnv('FIREBASE_ADMIN_PRIVATE_KEY'),
    clientEmail: getRequiredEnv('FIREBASE_ADMIN_CLIENT_EMAIL'),
  },
  database: {
    url: getRequiredEnv('DATABASE_URL'),
  },
};
```

---

## FIREBASE ADMIN SDK

### Configuracion segura

```typescript
// lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

// En Vercel, la private key viene con \n escapados
const formattedPrivateKey = privateKey?.replace(/\\n/g, '\n');

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: formattedPrivateKey,
    }),
  });
}
```

### En Vercel

1. Ir a Project Settings > Environment Variables
2. Agregar cada variable
3. Para FIREBASE_ADMIN_PRIVATE_KEY: copiar el JSON completo
4. Marcar como "Secret" las variables sensibles

---

## ROTACION DE SECRETOS

### Cuando rotar:
- Sospecha de filtracion
- Empleado sale del equipo
- Periodicamente (cada 90 dias recomendado)
- Despues de un incidente de seguridad

### Como rotar:
```bash
# 1. Generar nuevo secreto en el servicio (Stripe, Firebase, etc.)
# 2. Actualizar en todas las plataformas (Vercel, etc.)
# 3. Deploy
# 4. Verificar que funciona
# 5. Revocar el secreto antiguo
```

---

## SI SE FILTRA UN SECRETO

### Acciones inmediatas:
1. **REVOCAR** el secreto inmediatamente en el servicio
2. **GENERAR** nuevo secreto
3. **ACTUALIZAR** en todos los entornos
4. **VERIFICAR** logs por uso no autorizado
5. **INVESTIGAR** como se filtro
6. **DOCUMENTAR** el incidente

### Para limpiar del historial de Git:
```bash
# CUIDADO: Reescribe historia
# Solo si el secreto no ha sido pusheado a remote

git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/secret-file" \
  --prune-empty --tag-name-filter cat -- --all

# Si ya esta en remote, mejor rotar el secreto
```

---

## HACER (obligatorio)

- Usar variables de entorno para TODOS los secretos
- Tener .gitignore completo
- Validar que variables requeridas existen al iniciar
- Usar .env.example como template
- Rotar secretos periodicamente

---

## EVITAR (prohibido)

- Hardcodear secretos en codigo
- Commitear archivos .env con secretos
- Loggear secretos
- Exponer secret keys en cliente
- Compartir secretos por chat/email

---

## Verificacion

- [ ] Ningun secreto hardcodeado en codigo?
- [ ] .gitignore incluye todos los archivos sensibles?
- [ ] .env.example existe como template?
- [ ] Variables requeridas validadas al iniciar?
- [ ] Secretos de produccion en secret manager o CI/CD?

---

*Los secretos filtrados son irrecuperables.*
