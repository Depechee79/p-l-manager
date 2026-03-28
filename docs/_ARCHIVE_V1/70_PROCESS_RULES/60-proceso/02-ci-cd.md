# REGLA: CI/CD (Integracion y Despliegue Continuo)

---

## Cuando aplica
- Todo proyecto con repositorio
- Antes de merge a main
- Despliegues a produccion

---

## Objetivo
Automatizar verificaciones y despliegues.
Previene: bugs en produccion, despliegues fallidos, inconsistencias.

---

## PIPELINE DE CI MINIMO

```
Push → Lint → Type Check → Tests → Build → [Deploy]
```

### Ejemplo GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Test
        run: npm test -- --coverage

      - name: Build
        run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: github.event_name == 'pull_request'
```

---

## GATES DE CALIDAD

### Antes de merge (obligatorio)

| Check | Comando | Debe pasar |
|-------|---------|------------|
| Lint | `npm run lint` | 0 errores |
| Types | `npm run type-check` | 0 errores |
| Tests | `npm test` | 100% passed |
| Build | `npm run build` | Exit 0 |

### Configurar como required

```yaml
# En GitHub: Settings > Branches > Branch protection rules
# Require status checks to pass before merging:
# - ci (lint)
# - ci (type-check)
# - ci (test)
# - ci (build)
```

---

## ESTRATEGIAS DE DEPLOYMENT

### 1. Deploy automatico a staging

```yaml
# Deploy a staging en cada push a main
deploy-staging:
  needs: ci
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - run: npm run build
    - name: Deploy to Vercel (staging)
      run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
      env:
        VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
        VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 2. Deploy manual a produccion

```yaml
# Deploy a produccion solo con approval manual
deploy-production:
  needs: ci
  if: github.event_name == 'workflow_dispatch'
  runs-on: ubuntu-latest
  environment:
    name: production
    url: https://example.com
  steps:
    - uses: actions/checkout@v4
    - run: npm ci
    - run: npm run build
    - name: Deploy to production
      run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## ENTORNOS

| Entorno | Proposito | Deploy |
|---------|-----------|--------|
| **Development** | Desarrollo local | Manual |
| **Staging/Preview** | Testing pre-produccion | Automatico en PR |
| **Production** | Usuarios reales | Manual o tag |

### Variables por entorno

```yaml
# Vercel o similar
# Development
NEXT_PUBLIC_API_URL=http://localhost:3001

# Staging
NEXT_PUBLIC_API_URL=https://staging-api.example.com

# Production
NEXT_PUBLIC_API_URL=https://api.example.com
```

---

## ROLLBACK

### Plan de rollback

1. **Detectar problema** (alertas, logs, usuarios)
2. **Decidir rollback** (severidad, tiempo de fix)
3. **Ejecutar rollback** (ver opciones abajo)
4. **Verificar** (smoke tests, monitoreo)
5. **Investigar** (RCA, fix)

### Opciones de rollback

```bash
# Vercel: Revertir a deployment anterior
vercel rollback [deployment-url]

# Git: Revertir commit
git revert HEAD
git push origin main

# Firebase: Revertir hosting
firebase hosting:channel:deploy previous --only hosting
```

---

## FIREBASE DEPLOY

### Deploy de Firestore rules

```yaml
deploy-rules:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    - name: Setup Firebase
      uses: w9jds/setup-firebase@main
      with:
        tools-version: 13.0.0

    - name: Deploy Firestore rules
      run: firebase deploy --only firestore:rules
      env:
        FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

### Deploy de Cloud Functions

```yaml
deploy-functions:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: cd functions && npm ci
    - run: firebase deploy --only functions
      env:
        FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

---

## CHECKLIST PRE-DEPLOY

```markdown
## Antes de deploy a produccion

### Codigo
- [ ] Todos los tests pasan
- [ ] Build exitoso
- [ ] Sin errores de lint/types
- [ ] Code review aprobado

### Funcionalidad
- [ ] Probado en staging
- [ ] Flujos criticos verificados
- [ ] Sin regresiones

### Operaciones
- [ ] Variables de entorno configuradas
- [ ] Migraciones ejecutadas (si aplica)
- [ ] Rollback plan listo
- [ ] Equipo notificado

### Post-deploy
- [ ] Smoke tests pasados
- [ ] Monitoreo activo
- [ ] Sin errores en logs
```

---

## HACER (obligatorio)

- CI en cada PR (lint, types, tests, build)
- Gates obligatorios antes de merge
- Deploy automatico a staging
- Rollback plan documentado
- Monitoreo post-deploy

---

## EVITAR (prohibido)

- Deploy sin CI pasando
- Deploy directo a produccion sin staging
- Deploy sin plan de rollback
- Ignorar alertas post-deploy

---

## Verificacion

- [ ] CI configurado y funcionando?
- [ ] Gates de calidad obligatorios?
- [ ] Deploy a staging automatico?
- [ ] Proceso de deploy a produccion definido?
- [ ] Rollback probado?

---

*CI/CD = Confianza para desplegar.*
