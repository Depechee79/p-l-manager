---
name: verificar
description: |
  Mandatory verification before marking any task as complete.
  USE WHEN saying "done", "completed", "ready", "finished", "terminado", "listo",
  or before closing any task.
disable-model-invocation: true
---

# Verificacion Obligatoria — P&L Manager

## REGLA ABSOLUTA

**NUNCA decir "listo", "terminado", "completado" o "done" sin ejecutar este checklist.**
Si cualquier paso falla, la tarea esta EN PROGRESO, no completada.

---

## CHECKLIST EN ORDEN

### Paso 0 — Explicar a Aitor

Antes de verificar, explicar EN ESPANOL:
- Que se hizo exactamente (archivos creados/modificados)
- Que se va a verificar ahora

### Paso 1 — TypeScript compila

```bash
npx tsc --noEmit
```

**Resultado esperado:** 0 errores.
**Si falla:** La tarea NO esta completa. Corregir errores de tipos primero.

### Paso 2 — Build exitoso

```bash
npm run build
```

**Resultado esperado:** Build completa sin errores.
**Si falla:** La tarea NO esta completa. Corregir errores de build primero.

### Paso 3 — Dev server arranca

```bash
npm run dev
```

**Verificar:** El servidor responde en `http://localhost:3004`.
**Si falla:** La tarea NO esta completa.

### Paso 4 — Verificacion visual

Abrir navegador en `http://localhost:3004` y navegar al area afectada por la tarea.
Verificar que:
- La pagina carga correctamente
- Los cambios realizados son visibles y funcionan como se espera
- No hay elementos rotos o fuera de lugar

### Paso 5 — Consola limpia

Abrir DevTools del navegador y verificar:
- 0 errores nuevos en consola
- 0 errores de red (4xx/5xx) nuevos
- Warnings conocidos se ignoran (React Router deprecations, DevTools, third-party cookies)

### Paso 6 — Scope completo

Verificar que NO quedan instancias del patron anterior:

```bash
grep -rn "OLD_PATTERN" src/
```

Reemplazar `OLD_PATTERN` con lo que se estaba arreglando/reemplazando.
**Resultado esperado:** 0 instancias restantes del patron viejo.

### Paso 7 — Tests pasan

```bash
npm test -- --run
```

**Resultado esperado:** Todos los tests pasan.
**Si hay tests nuevos para el codigo modificado:** verificar que cubren al menos los 3 estados basicos (ideal, empty, error).

---

## RESULTADO

| Paso | Comando | Resultado |
|------|---------|-----------|
| 1. tsc | `npx tsc --noEmit` | OK / FAIL |
| 2. build | `npm run build` | OK / FAIL |
| 3. dev | `npm run dev` | OK / FAIL |
| 4. visual | Navegador localhost:3004 | OK / FAIL |
| 5. consola | DevTools | OK / FAIL |
| 6. scope | `grep -rn` patron | OK / FAIL |
| 7. tests | `npm test -- --run` | OK / FAIL |

**Veredicto:**
- 7/7 OK → Tarea COMPLETADA. Reportar a Aitor.
- Cualquier FAIL → Tarea EN PROGRESO. Corregir y re-verificar.

---

## REGLAS

1. **Este checklist es SECUENCIAL.** Si el paso 1 falla, no continuar al paso 2.
2. **No hay excepciones.** "Solo fue un cambio pequeno" no es excusa para saltar verificacion.
3. **Evidencia, no promesas.** Ejecutar los comandos y mostrar el resultado real.
4. **Si algo falla despues de corregir:** volver a ejecutar TODO el checklist desde el paso 1.
