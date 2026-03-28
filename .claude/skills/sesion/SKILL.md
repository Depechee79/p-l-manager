---
name: sesion
description: |
  Session start and end protocol for P&L Manager.
  USE WHEN user says "nueva sesion", "empezamos", "inicio", "cierre sesion",
  "terminamos", "documenta", "fin de sesion".
disable-model-invocation: true
---

# Protocolo de Sesion — P&L Manager

## INICIO DE SESION

Cuando Aitor dice "nueva sesion", "empezamos", "inicio", o equivalente:

### 1. Leer estado actual

```bash
# Estado del backlog
cat docs/BACKLOG.md

# Contexto del proyecto
cat docs/CONTEXTO.md

# Ultimos commits
git log --oneline -10

# Rama actual
git branch --show-current

# Estado del working tree
git status
```

### 2. Reportar a Aitor

Presentar en espanol:
- **Sesion anterior:** numero, fecha, resumen breve
- **Estado del proyecto:** que funciona, que esta pendiente, deuda tecnica activa
- **Rama:** en cual estamos, hay cambios sin commit?
- **Backlog:** tareas pendientes priorizadas

### 3. Esperar instrucciones

NO empezar a trabajar hasta que Aitor diga que hacer en esta sesion.
Preguntar: "Que hacemos en esta sesion?"

---

## FIN DE SESION

Cuando Aitor dice "cierre sesion", "terminamos", "documenta", "fin de sesion", o equivalente.

### Prerequisito: Verificacion

SOLO cerrar sesion si tsc + build pasan:

```bash
npx tsc --noEmit && npm run build
```

Si fallan, corregir ANTES de cerrar.

### 1. Documentar en HISTORIAL_SESIONES.md

Agregar entrada al final de `docs/HISTORIAL_SESIONES.md`:

```markdown
## Sesion #N — YYYY-MM-DD

### Resumen
Descripcion breve de lo realizado (2-3 lineas).

### Archivos creados
- path/to/file.tsx — descripcion

### Archivos modificados
- path/to/file.tsx — que cambio

### Verificacion
- tsc: OK
- build: OK
- tests: N/N pass
- inspector: APROBADO/NO APROBADO

### Pendientes para proxima sesion
- [ ] Tarea pendiente 1
- [ ] Tarea pendiente 2

### Hallazgos fuera del scope
- Hallazgo 1 (archivo, descripcion, severidad)
```

### 2. Actualizar BACKLOG.md

En `docs/BACKLOG.md`:
- Marcar como completadas las tareas terminadas en esta sesion
- Agregar nuevas tareas descubiertas durante la sesion
- Re-priorizar si es necesario

### 3. Actualizar CONTEXTO.md

En `docs/CONTEXTO.md`:
- Actualizar el estado actual si cambio significativamente
- Agregar notas tecnicas relevantes para la proxima sesion
- Actualizar contadores (tests, componentes, etc.) si cambiaron

### 4. Resumen para Aitor

Presentar en espanol:
- **Que se hizo:** lista de tareas completadas
- **Que se verifico:** resultado de verificaciones
- **Que queda pendiente:** tareas para proxima sesion
- **Hallazgos:** cosas descubiertas fuera del scope

### 5. Commit de documentacion

```bash
git add docs/HISTORIAL_SESIONES.md docs/BACKLOG.md docs/CONTEXTO.md
git commit -m "docs: cierre sesion #N — [resumen breve]"
```

---

## REGLAS

1. **Cada sesion se documenta.** Sin documentacion = no existio.
2. **NUNCA cerrar sesion si tsc o build fallan.** Corregir primero.
3. **El numero de sesion es secuencial.** Consultar HISTORIAL_SESIONES.md para el siguiente.
4. **Commits de docs son SEPARADOS** del commit de codigo. No mezclar.
5. **Si no hubo trabajo de codigo:** documentar igualmente (planificacion, decisiones, investigacion).
6. **El inspector se ejecuta ANTES del cierre de sesion**, no durante.
