---
name: scanner
description: |
  Exhaustive quality scanner that audits any section, page, component, or service
  against the Supreme Rule (00-regla-suprema.md) and all project contracts.
  USE WHEN Aitor says "escanea", "audita", "revisa", "scanner", "pasa el scanner",
  "verifica calidad", "comprueba", "analiza", or points to any file/folder/feature
  asking for a quality check.
---

# Scanner de Calidad — P&L Manager

## METODOLOGIA: DOS ANILLOS

Antes de escanear, identificar dos anillos de alcance y presentarlos a Aitor para confirmacion.

### Ring 1 — ESCANEAR + REPARAR (scope directo)
Archivos que son el TARGET del escaneo. Se leen, se auditan y se REPARAN si hay violaciones.

### Ring 2 — LEER + REPORTAR (dependencias)
Archivos que Ring 1 importa, consume o de los que depende. Se leen para entender contexto.
Se REPORTAN hallazgos pero NO se modifican (regla de bloqueo).

**PRESENTAR ambos anillos a Aitor ANTES de escanear. Esperar confirmacion.**

Ejemplo:
```
RING 1 (escanear + reparar):
  - src/features/cierres/components/CierreWizard.tsx
  - src/features/cierres/hooks/useCierreForm.ts

RING 2 (leer + reportar):
  - src/shared/components/Modal.tsx (lo usa CierreWizard)
  - src/core/services/CierreService.ts (lo consume useCierreForm)
  - src/types/cierre.ts (tipos del dominio)

Confirmas el scope?
```

---

## PROCEDIMIENTO

### Paso 1 — Identificar archivos en scope

Usar Glob y Grep para mapear Ring 1 y Ring 2 completos.
Listar todos los archivos con su anillo asignado.

### Paso 2 — Leer Regla Suprema

Leer `.claude/rules/00-regla-suprema.md` para recordar los 8 dominios de excelencia
y las prohibiciones absolutas.

### Paso 3 — Leer contratos relevantes

Segun tabla trigger de la Regla Suprema, leer los contratos OBLIGATORIOS:

| Si Ring 1 contiene... | Contratos OBLIGATORIOS |
|------------------------|----------------------|
| className, estilos, colores | `docs/contracts/VISUAL_CONTRACT.md` |
| Pantalla o pagina | `docs/contracts/UX_CONTRACT.md` + `VISUAL_CONTRACT.md` |
| Firestore queries, rules | `docs/contracts/FIREBASE_CONTRACT.md` |
| Flujo usuario, estados, textos | `docs/contracts/PRODUCT_CONTRACT.md` |
| Componente shared | `docs/COMPONENT_INVENTORY.md` |
| Tests | `docs/contracts/TESTING_CONTRACT.md` |
| Error handling, catch, toasts | `docs/contracts/ERROR_HANDLING_CONTRACT.md` |
| Accesibilidad, ARIA | `docs/contracts/ACCESSIBILITY_CONTRACT.md` |
| Performance, lazy loading | `docs/contracts/PERFORMANCE_CONTRACT.md` |
| Estado, Context | `docs/contracts/STATE_MANAGEMENT_CONTRACT.md` |
| OCR, documentos | `docs/contracts/DOCUMENT_RECOGNITION_CONTRACT.md` |
| Rutas, navegacion | `docs/contracts/ROUTING_CONTRACT.md` |
| Deploy, hosting | `docs/contracts/DEPLOYMENT_CONTRACT.md` |

### Paso 4 — Escanear cada archivo contra 8 dominios

Para CADA archivo en Ring 1, auditar los 8 dominios aplicables.
Para CADA archivo en Ring 2, auditar mentalmente y anotar hallazgos sin reparar.

#### 4.1 UI Visual
- [ ] Colores: SOLO tokens CSS (`var(--primary)`, etc.), NUNCA hex/gray-*/color hardcodeado
- [ ] Sombras: SOLO tokens de elevacion (`shadow-elevation-*`), NUNCA shadow-sm/md/lg directo
- [ ] Z-index: SOLO escala de tokens (dropdown:100, sticky:200, fixed:300, modal-backdrop:400, modal:500, popover:600, tooltip:700, toast:800)
- [ ] Tipografia: `font-heading` para titulos, `font-body` para contenido
- [ ] Touch targets: 44x44px minimo (`min-h-11 min-w-11`) en interactivos
- [ ] Focus rings: visibles en TODOS los elementos interactivos
- [ ] Transiciones: hover/focus con transition, nunca cambio visual abrupto
- [ ] Spacing: usando escala de tokens, no valores arbitrarios

#### 4.2 UX Experience
- [ ] 4 estados en paginas con datos: LOADING (skeleton), DATA, EMPTY (CTA), ERROR (retry)
- [ ] 3 fases en acciones async: IDLE → LOADING (button loading) → RESULT (toast)
- [ ] Acciones destructivas: confirmacion explicita con nombre de accion
- [ ] No scroll anidado (overflow-auto dentro de overflow-auto)
- [ ] No triple Card nesting (Card > Card > Card)
- [ ] No modal sobre modal
- [ ] Mobile-first: la app se usa en sala con una mano

#### 4.3 Code Quality
- [ ] TypeScript strict: 0 `any`, 0 `@ts-ignore`, 0 `@ts-expect-error`, 0 `as unknown as X`
- [ ] No callbacks vacios: `catch {}`, `() => {}` sin cuerpo
- [ ] No dead code: imports no usados, codigo comentado, variables sin usar
- [ ] No `console.log` en codigo final (usar LoggerService)
- [ ] Error handling completo: `catch (error: unknown)` + logError() + showToast()
- [ ] Hooks antes de returns condicionales (regla de React)
- [ ] useEffect con deps correctas (no deps faltantes, no deps sobrantes)
- [ ] Named exports ONLY (no default exports)
- [ ] Un componente por archivo
- [ ] Imports ordenados: React → third-party → @shared → @core → @features → local
- [ ] No strings magicos sueltos (usar constantes)
- [ ] Componentes shared usados cuando existen (no reinventar)
- [ ] Alias de imports canonicos (@shared/*, @core/*, etc.)

#### 4.4 Firebase / Data
- [ ] Init con singleton (getFirestoreInstance())
- [ ] TODAS las queries con `limit()` en colecciones grandes
- [ ] Bulk writes con `writeBatch` (max 500, loop si mas)
- [ ] `onSnapshot` con cleanup en useEffect return + error callback
- [ ] Timestamps con `Timestamp.now()` o `serverTimestamp()`
- [ ] Firestore rules: deny-by-default, ownership check, field whitelist
- [ ] Indices compuestos existen en `firestore.indexes.json` para queries where() + orderBy()
- [ ] restaurantId en TODAS las queries (multi-tenant)

#### 4.5 Accessibility
- [ ] Keyboard accessible: todos los interactivos responden a Enter/Space/Escape
- [ ] `htmlFor` en TODOS los labels de formulario
- [ ] Color nunca como unico indicador (usar texto + icono + patron)
- [ ] Modals: `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- [ ] Alt text en TODAS las imagenes significativas
- [ ] Contraste AA: texto sobre fondo cumple 4.5:1 (3:1 para texto grande)
- [ ] Touch targets 44x44px (`min-h-11 min-w-11`)

#### 4.6 Performance
- [ ] No re-renders innecesarios (verificar deps de useMemo/useCallback)
- [ ] `useCallback` para funciones pasadas como props a children
- [ ] Cleanup de subscriptions en useEffect return
- [ ] Images: `loading="lazy"` below the fold
- [ ] No memory leaks: listeners limpiados, abort controllers usados
- [ ] Code splitting: React.lazy + Suspense en rutas

#### 4.7 Security
- [ ] No secrets en codigo cliente (API keys, tokens, passwords)
- [ ] Validacion en boundaries (input usuario, respuestas API)
- [ ] Firestore rules como primera linea de defensa
- [ ] XSS prevention: no `dangerouslySetInnerHTML`
- [ ] Multi-restaurante: SIEMPRE verificar restaurantId en queries y rules

#### 4.8 Document Recognition
- [ ] Claude API Vision (NO Tesseract ni OCR generico)
- [ ] Confidence thresholds definidos para cada campo extraido
- [ ] Human review requerido: NUNCA aceptar datos OCR sin confirmacion del usuario
- [ ] Structured output: datos extraidos en formato tipado (no strings sueltos)
- [ ] Fallback: si la confianza es baja, mostrar campo para edicion manual

---

### Paso 5 — Generar reporte

#### Formato del reporte

```markdown
# Scanner Report — [Target]
Fecha: YYYY-MM-DD | Archivos Ring 1: N | Archivos Ring 2: N

## Violaciones encontradas

| # | Archivo | Dominio | Severidad | Descripcion | Estado |
|---|---------|---------|-----------|-------------|--------|
| 1 | CierreWizard.tsx | UI Visual | P0 | Color hardcodeado #333 en linea 45 | REPARADO |
| 2 | useCierreForm.ts | Code | P1 | catch vacio en linea 78 | REPARADO |
| 3 | Modal.tsx (R2) | Accessibility | P1 | Falta aria-labelledby | REPORTADO |

## Severidades

- **P0 CRITICO**: Rompe funcionalidad, seguridad o compilacion. Reparar SIEMPRE (Ring 1).
- **P1 ALTO**: Viola contrato o regla suprema. Reparar en Ring 1, reportar en Ring 2.
- **P2 MEDIO**: Mejora necesaria pero no bloquea. Reportar siempre.
- **P3 BAJO**: Mejora cosmtica o de estilo. Reportar al final.

## Resumen

- Violaciones Ring 1: N encontradas, N reparadas
- Hallazgos Ring 2: N reportados (no modificados, regla de bloqueo)
- Dominios limpios: [lista]
- Dominios con hallazgos: [lista]
```

---

## REGLAS DEL SCANNER

1. **Ring 2 es INTOCABLE.** Leer para entender, reportar hallazgos, NUNCA modificar.
2. **Si un hallazgo Ring 1 requiere tocar Ring 2:** PARAR, informar a Aitor, esperar decision.
3. **Cada reparacion en Ring 1:** verificar que compila (`npx tsc --noEmit`) antes de continuar.
4. **Al terminar:** ejecutar `npx tsc --noEmit` + `npm run build` para confirmar 0 regresiones.
5. **El scanner NO reemplaza el inspector.** Scanner = calidad de codigo. Inspector = verificacion funcional.
