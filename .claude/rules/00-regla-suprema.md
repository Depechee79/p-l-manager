---
description: "REGLA SUPREMA — Overrides all other rules. Mandatory 7-phase protocol for every task. Quality 10/10 or don't ship. Applies to ALL files, ALL sessions, ALL agents."
paths:
  - "**/*"
---

# REGLA SUPREMA — CALIDAD 10/10 O NO SE HACE

> No hay presion de tiempo. No hay atajos. No hay parches.
> La velocidad viene de NO tener que rehacer trabajo. No de hacerlo rapido.
> El unico estandar aceptable es: "Esta es la mejor forma posible de escribir esto en 2026."

---

## FILOSOFIA

El propietario del proyecto (Aitor) exige precision quirurgica sobre velocidad. El verificara
tu trabajo manualmente. Si dices que algo funciona y no funciona, la confianza se rompe.
Si omites tareas de su peticion, lo nota. Si parcheas en vez de arreglar la raiz, el bug
vuelve peor.

Principios fundamentales:
- Un 9.2/10 NO es aceptable. Solo 10/10.
- "Funciona pero el codigo es feo" → reescribirlo bien.
- "Asumi X" → deberias haber preguntado a Aitor.
- "Copie el patron de otro archivo" → verifica que es el MEJOR patron disponible hoy.
- "No tuve tiempo de verificar" → no hay presion de tiempo. Verificar TODO.

---

## PROTOCOLO OBLIGATORIO DE 7 FASES

Cada tarea sigue estas 7 fases EN ORDEN. Saltarse o apresurarse una fase viola esta regla.

### FASE 0 — CHECKLIST DE TAREA (antes que nada)

Lee el mensaje completo de Aitor. Releelo. Extrae CADA tarea, requisito e instruccion
en un checklist numerado. Ninguna es opcional. Ninguna es implicita.

Si alguna tarea es ambigua, pregunta a Aitor ANTES de empezar.

Este checklist es el contrato de la sesion. Cada item debe abordarse en el
reporte final (Fase 6), con evidencia.

Por que: Los agentes consistentemente ejecutan el 60% de las tareas pedidas
y omiten silenciosamente el 40%. El checklist lo previene.

### FASE 1 — LEER CONTRATOS Y DOCUMENTACION (antes de leer codigo)

Leer estos archivos ANTES de tocar codigo:
- `CLAUDE.md` — constitucion del proyecto
- `docs/BACKLOG.md` — estado actual, tareas pendientes
- **Contratos OBLIGATORIOS segun tabla trigger** (no opcionales):

| Si la tarea involucra... | Contratos OBLIGATORIOS |
|--------------------------|----------------------|
| `className`, estilos, colores, sombras, bordes | `docs/contracts/VISUAL_CONTRACT.md` |
| Pantalla nueva o arquetipo de pagina | `docs/contracts/UX_CONTRACT.md` + `VISUAL_CONTRACT.md` |
| Firestore queries, rules, colecciones, indices | `docs/contracts/FIREBASE_CONTRACT.md` |
| Flujo de usuario, estados, textos visibles | `docs/contracts/PRODUCT_CONTRACT.md` |
| Componente nuevo o modificacion de shared/ | `docs/COMPONENT_INVENTORY.md` |
| Tests, verificacion, coverage | `docs/contracts/TESTING_CONTRACT.md` |
| Deploy, hosting, functions | `docs/contracts/DEPLOYMENT_CONTRACT.md` |
| Rutas, navegacion, code-splitting | `docs/contracts/ROUTING_CONTRACT.md` |
| Error handling, catch blocks, toasts | `docs/contracts/ERROR_HANDLING_CONTRACT.md` |
| Accesibilidad, ARIA, keyboard nav | `docs/contracts/ACCESSIBILITY_CONTRACT.md` |
| Performance, bundle, lazy loading | `docs/contracts/PERFORMANCE_CONTRACT.md` |
| Estado, Context, useState | `docs/contracts/STATE_MANAGEMENT_CONTRACT.md` |
| OCR, albaranes, facturas, documentos | `docs/contracts/DOCUMENT_RECOGNITION_CONTRACT.md` |

> **NUNCA decidir que un contrato "no es relevante" sin verificar la tabla.**
> Si la tarea toca CSS → VISUAL_CONTRACT es obligatorio, aunque "solo sea un cambio pequeno".

### FASE 2 — LEER Y ENTENDER TODO EL CODIGO AFECTADO (no tocar nada)

No leer solo el archivo objetivo. Trazar el ARBOL COMPLETO DE DEPENDENCIAS:
- Que importa este archivo? Que importa de el?
- Que componentes consumen este componente? Que props fluyen?
- Que servicios escriben a la misma coleccion Firestore?
- De que tipos depende? Que tests lo cubren?
- Si cambio esta firma de funcion, que se rompe downstream?

FIRESTORE — AREA DE MAYOR RIESGO:
- Leer `firestore.rules` COMPLETO antes de modificar cualquier operacion de datos.
- Trazar: QUIEN ejecuta la operacion → QUE regla la valida → QUE campos se verifican.
- Verificar que existen indices compuestos en `firestore.indexes.json` para queries where() + orderBy().
- Evaluar impacto de coste: queries sin limit(), lecturas masivas, onSnapshot sin cleanup.

No avanzar a Fase 3 hasta entender completamente el arbol de impacto.

**SCANNER AUTOMATICO:** Mientras lees cada archivo en scope, ejecutar mentalmente el checklist
del scanner (`.claude/skills/scanner/SKILL.md` secciones 4.1-4.8) contra el. Anotar cada
violacion encontrada. Estas violaciones van en el reporte de Fase 6 bajo "Hallazgos fuera del scope."
NO arreglar hallazgos del scanner a menos que esten directamente relacionados con la tarea actual.
Si se encuentran violaciones criticas, informar a Aitor antes de continuar.

### FASE 3 — PENSAR Y VERIFICAR ENTENDIMIENTO (no tocar nada)

- Verificar que lo que CREES que pasa, REALMENTE pasa. Releer codigo si hay duda.
- Buscar la MEJOR PRACTICA ACTUAL (2026) para lo que vas a hacer.
- Pensar en edge cases: campos null, arrays vacios, permisos faltantes, race conditions.
- Si algo no esta claro: PARAR y preguntar a Aitor. NUNCA asumir. NUNCA inventar.

**REGLA DE HALLAZGOS OBSOLETOS — CRITICA:**
Cuando encuentres un TODO, FIXME, "pendiente implementar", comentario viejo, o un documento
que diga que algo esta roto/faltante/pendiente, NO asumir que sigue siendo relevante.

**VERIFICACION POR ANTIGUEDAD:**
1. Identificar la sesion del hallazgo (comentario, nombre doc, git blame).
2. Comparar con la sesion actual (ver docs/BACKLOG.md o ultimo commit).
3. Aplicar esta escala:

| Sesiones atras | Riesgo obsolescencia | Accion |
|---------------|---------------------|--------|
| 1-2 | BAJO — probablemente valido | Verificar rapido, probablemente actuar |
| 3-5 | MEDIO — puede haberse resuelto | Verificacion completa antes de actuar |
| 5+ | ALTO — probablemente obsoleto | Asumir obsoleto salvo prueba contraria |

### FASE 4 — PLANIFICAR EXACTAMENTE QUE SE VA A HACER

- Listar archivos que se van a modificar
- Listar cambios exactos en cada archivo
- Si se toca shared/ → impacto en TODAS las paginas que lo consumen
- Si se toca Firestore → verificar rules + indices + otros servicios
- Presentar plan a Aitor si la tarea es compleja

### FASE 5 — EJECUTAR CON PRECISION

- Seguir el plan de Fase 4 al pie de la letra
- Un cambio a la vez, verificar que compila tras cada cambio
- NO desviarse del scope. NO "mejorar" codigo adyacente.
- Si surge algo inesperado → PARAR, evaluar, informar si necesario

### FASE 6 — VERIFICAR CON EVIDENCIA REAL

Ejecutar el skill `verificar` (.claude/skills/verificar/SKILL.md):
1. `npx tsc --noEmit` → 0 errores
2. `npm run build` → OK
3. `npm run dev` → puerto 3004 responde
4. Verificacion visual en navegador
5. Consola limpia (0 errores nuevos)
6. Scope completo (grep OLD_PATTERN → 0 instancias)
7. Tests pasan

Ejecutar el skill `inspector` al final de la sesion.

**NUNCA decir "listo" sin ejecutar este checklist.**

---

## REGLA DE BLOQUEO ABSOLUTO

> Todo codigo, componente, funcion, seccion, flujo, estilo o archivo que NO este
> explicitamente nombrado en la tarea esta **BLOQUEADO**. Esto incluye:
> - NO modificar. NO borrar. NO refactorizar. NO "mejorar". NO "limpiar".
> - NO "actualizar para coherencia". NO "corregir de paso". NO "modernizar".
> - NO cambiar nombres, imports, orden, formato ni comentarios de codigo bloqueado.

**Que es "codigo bloqueado"?** Todo lo que no menciono Aitor en su instruccion.
Si dice "arregla el wizard de cierres", SOLO el wizard de cierres es scope.
Los componentes que el wizard usa estan bloqueados AUNQUE los leas para entender.
Leer ≠ permiso para modificar.

**Si necesitas tocar algo bloqueado para que la tarea funcione:**
1. Di QUE archivo/funcion necesitas tocar y POR QUE es imprescindible
2. Di QUE cambiaria exactamente (estado actual → cambio propuesto)
3. Di QUE riesgo hay si NO lo tocas (no compila? no funciona? solo es cosmetico?)
4. ESPERA decision de Aitor. **Sin respuesta = NO tocar.**

**Justificaciones que NO desbloquean codigo:**
- "Queda mas limpio" → NO. Reportar al final, no tocar.
- "Es mas coherente" → NO. Reportar al final, no tocar.
- "Encontre un bug ahi" → NO. Reportar al final, no tocar.
- "El patron es viejo" → NO. Reportar al final, no tocar.
- "Mejora el rendimiento" → NO. Reportar al final, no tocar.

**LA UNICA justificacion valida:** "Sin este cambio especifico, la tarea que me pides
NO compila o NO funciona." Y aun asi: parar, informar, esperar decision.

---

## PROHIBICIONES ABSOLUTAS

| Prohibicion | Razon |
|-------------|-------|
| `any` en TypeScript | Desactiva el type system |
| `@ts-ignore` / `@ts-expect-error` | Oculta errores reales |
| `as unknown as X` | Bypass de tipos peligroso |
| `console.log` en codigo final | Usar LoggerService |
| `catch {}` o `catch (e) {}` vacio | Oculta errores silenciosamente |
| Strings magicos sueltos | Usar constantes |
| Colores hardcodeados (hex, gray-*, etc.) | Usar tokens CSS |
| Z-index arbitrarios | Usar escala de tokens |
| Shadows directos (shadow-sm/md/lg) | Usar tokens de elevacion |
| `default export` | Solo named exports |
| Hooks despues de returns condicionales | Viola reglas de React |
| `window.alert()` / `window.confirm()` | Usar Modal/Toast |
| `setInterval` para datos Firestore | Usar onSnapshot |
| `Promise.all(N updateDoc())` | Usar writeBatch |
| Eliminar/modificar codigo no pedido | Regla de bloqueo |
| Commitear codigo que no compila | Verificar antes de commit |
| Asumir sin preguntar | Preguntar siempre ante duda |

---

## 8 DOMINIOS DE EXCELENCIA

### UI Visual
- TODOS los valores vienen de tokens CSS (colores, sombras, z-index, spacing, radius)
- Tipografia: font-heading para titulos, font-body para contenido
- Touch targets: 44x44px minimo (camareros con movil)
- Focus rings visibles en TODOS los interactivos
- Transiciones en hover/focus (nunca cambio visual abrupto)

### UX Experience
- 4 estados en paginas con datos: LOADING (skeleton), DATA, EMPTY (CTA), ERROR (retry)
- 3 fases en acciones async: IDLE → LOADING (button loading) → RESULT (toast)
- Acciones destructivas: confirmacion con nombre especifico de accion
- No scroll anidado. No triple Card nesting. No modal sobre modal.
- Mobile-first: la app se usa en sala con una mano

### CODE Engineering
- TypeScript strict: 0 `any`, 0 `@ts-ignore`
- Error handling: `catch (error: unknown)` + logError() + showToast()
- Dead code elimination: sin imports no usados, sin codigo comentado
- Imports ordenados: React → third-party → @shared → @core → local
- Named exports, un componente por archivo, hooks antes de returns

### DATA Firebase
- Init con singleton (getFirestoreInstance() dentro del cuerpo de funcion)
- TODAS las queries con limit() en colecciones grandes
- Bulk writes con writeBatch (max 500, loop si mas)
- onSnapshot con cleanup en useEffect return + error callback
- Timestamps con Timestamp.now() o serverTimestamp()
- Firestore rules deny-by-default, ownership check, field whitelist

### TESTING
- Comportamiento vs implementacion (test lo que hace, no como lo hace)
- 3 estados minimo por componente: ideal, empty, error
- Mocks de Firebase services, no mocks de business logic
- vi.clearAllMocks() en beforeEach

### ACCESSIBILITY
- WCAG 2.2 AA obligatorio
- Keyboard navigation en todos los interactivos
- htmlFor en TODOS los labels de formulario
- Color nunca como unico indicador (usar texto + icono + patron)
- Modals: role="dialog" + aria-modal="true" + aria-labelledby
- Touch targets 44x44px (min-h-11 min-w-11)

### PERFORMANCE
- Core Web Vitals: LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms
- Code splitting: React.lazy + Suspense en rutas (excepto login)
- Images: loading="lazy" below the fold
- useMemo para computaciones costosas, useCallback para callbacks a children
- Cleanup: subscriptions, abort controllers, listeners

### SECURITY
- No secrets en codigo cliente
- Validacion en boundaries (input usuario, APIs externas)
- Firestore rules como primera linea de defensa
- XSS prevention (no dangerouslySetInnerHTML)
- Multi-restaurante: SIEMPRE verificar restaurantId en queries

---

## REPORTE DE FIN DE TAREA

Al terminar cualquier tarea, dar a Aitor un reporte con:
1. **Que se hizo** (archivos creados/modificados, con cambios exactos)
2. **Que se verifico** (tsc, build, tests, visual, consola)
3. **Que se encontro fuera del scope** (hallazgos del scanner, bugs detectados, mejoras posibles)
4. **Que queda pendiente** (si algo)

Cada item del checklist de Fase 0 debe aparecer en el reporte con su resultado.
