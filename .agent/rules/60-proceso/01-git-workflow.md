# REGLA: Git Workflow

---

## Cuando aplica
- Todo desarrollo de codigo
- Todos los commits
- Pull requests y code review

---

## Objetivo
Mantener un historial de Git limpio, trazable y colaborativo.
Previene: commits confusos, perdida de trabajo, conflictos.

---

## COMMITS SEMANTICOS (Conventional Commits)

### Formato
```
<tipo>(<scope>): <descripcion>

[cuerpo opcional]

[footer opcional]
```

### Tipos

| Tipo | Cuando usar | Ejemplo |
|------|-------------|---------|
| **feat** | Nueva funcionalidad | `feat(menu): add item filtering` |
| **fix** | Correccion de bug | `fix(cart): resolve quantity update issue` |
| **docs** | Solo documentacion | `docs: update README setup instructions` |
| **style** | Formato, sin cambio de logica | `style: fix indentation in utils` |
| **refactor** | Refactor sin cambio funcional | `refactor(auth): simplify login flow` |
| **test** | Anadir o modificar tests | `test(order): add checkout tests` |
| **chore** | Tareas de mantenimiento | `chore: update dependencies` |
| **perf** | Mejora de performance | `perf(list): virtualize long lists` |

### Reglas de mensaje

```bash
# BIEN
feat(auth): add Google OAuth login
fix(cart): prevent negative quantities
docs: add API documentation

# MAL
updated stuff          # No describe que
Fix                    # Muy vago
WIP                    # No commitear WIP
```

### Mensaje con cuerpo (opcional)

```bash
fix(checkout): handle payment timeout correctly

The previous implementation would silently fail when the payment
provider timed out. Now we:
- Retry up to 3 times with exponential backoff
- Show clear error message to user
- Log the failure for monitoring

Closes #123
```

---

## ESTRATEGIA DE BRANCHES

### Modelo recomendado (GitHub Flow simplificado)

```
main (produccion)
  |
  +-- feature/add-menu-filtering
  |
  +-- fix/cart-quantity-bug
  |
  +-- refactor/auth-simplification
```

### Naming de branches

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Feature | `feature/<descripcion>` | `feature/add-user-profile` |
| Bug fix | `fix/<descripcion>` | `fix/login-redirect-loop` |
| Refactor | `refactor/<descripcion>` | `refactor/extract-form-validation` |
| Hotfix | `hotfix/<descripcion>` | `hotfix/critical-payment-bug` |

### Flujo de trabajo

```bash
# 1. Crear branch desde main actualizado
git checkout main
git pull origin main
git checkout -b feature/nueva-funcionalidad

# 2. Desarrollar con commits atomicos
git add .
git commit -m "feat(module): add initial structure"
git commit -m "feat(module): implement core logic"
git commit -m "test(module): add unit tests"

# 3. Push y crear PR
git push -u origin feature/nueva-funcionalidad
# Crear PR en GitHub

# 4. Despues de aprobar y merge, limpiar
git checkout main
git pull origin main
git branch -d feature/nueva-funcionalidad
```

---

## PULL REQUESTS

### Checklist antes de crear PR

- [ ] Codigo compila sin errores
- [ ] Tests pasan
- [ ] Lint pasa
- [ ] Commits son atomicos y bien descritos
- [ ] Branch esta actualizada con main
- [ ] No hay archivos innecesarios (console.log, .env, etc.)

### Estructura de PR

```markdown
## Descripcion
[Que hace este PR y por que]

## Cambios
- [Cambio 1]
- [Cambio 2]

## Testing
- [ ] Tests unitarios
- [ ] Tests de integracion
- [ ] Probado manualmente en [entorno]

## Screenshots (si aplica)
[Antes/Despues]

## Notas para reviewer
[Puntos de atencion, decisiones tomadas]
```

### Tamano de PRs

| Lineas cambiadas | Tamano | Accion |
|------------------|--------|--------|
| < 50 | Pequeno | OK |
| 50-200 | Mediano | OK |
| 200-500 | Grande | Considerar dividir |
| > 500 | Muy grande | Dividir obligatorio |

---

## CODE REVIEW

### Como reviewer

```markdown
## Checklist de review

### Funcionalidad
- [ ] Cumple los requisitos?
- [ ] Maneja errores correctamente?
- [ ] Sin regresiones obvias?

### Codigo
- [ ] Es legible y mantenible?
- [ ] Sigue las convenciones del proyecto?
- [ ] Sin codigo duplicado?
- [ ] Sin codigo muerto?

### Seguridad
- [ ] Sin secretos hardcodeados?
- [ ] Input validado?
- [ ] Permisos verificados?

### Testing
- [ ] Tests cubren cambios?
- [ ] Tests pasan?
```

### Tipos de comentarios

```markdown
# Bloquea merge
[BLOCKING] Este bug puede causar perdida de datos

# Sugerencia importante
[SUGGESTION] Considera extraer esto a una funcion

# Nitpick (no bloquea)
[NIT] Podrias renombrar esto para mayor claridad

# Pregunta
[QUESTION] Por que elegiste este approach?

# Felicitacion
[PRAISE] Excelente solucion, muy elegante
```

---

## COMANDOS PROHIBIDOS

| Comando | Riesgo | Alternativa |
|---------|--------|-------------|
| `git push --force` | Destruye historial | `git push --force-with-lease` |
| `git reset --hard` | Pierde trabajo | `git stash` o branch temporal |
| `git clean -xdf` | Borra archivos | Revisar antes con `-n` |
| `git rebase -i` (en shared) | Reescribe historia | Solo en branches propias |

---

## HACER (obligatorio)

- Commits atomicos y bien descritos
- Conventional Commits
- PRs de tamano razonable (< 500 lineas)
- Code review antes de merge
- Branch actualizada antes de merge

---

## EVITAR (prohibido)

- Commits WIP o sin descripcion
- Force push a branches compartidas
- PRs de miles de lineas
- Merge sin review
- Commits con secretos

---

## Verificacion

- [ ] Commits siguen Conventional Commits?
- [ ] Branch nombrada correctamente?
- [ ] PR tiene descripcion clara?
- [ ] Code review completado?
- [ ] Sin archivos innecesarios en commit?

---

*Git bien usado = colaboracion sin dolor.*
