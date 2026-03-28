---
name: inspector
description: |
  Anti-regression audit system. Opens browser, navigates ALL pages in scope,
  verifies console, loading, interaction, and real data. Generates report in Spanish.
  MANDATORY at the end of every work session, BEFORE saying "done".
  USE WHEN: finishing any code task, or when Aitor says "inspector",
  "inspecciona", "verifica todo", "pasa el inspector", "reporte de estado".
---

# Inspector Anti-Regresiones — P&L Manager

## CUANDO EJECUTAR

1. **OBLIGATORIO** al final de CADA sesion de trabajo, ANTES de decir "listo"
2. Cuando Aitor lo pida explicitamente
3. Despues de corregir errores encontrados por el inspector (re-inspeccion)

## PREREQUISITOS (verificar antes de abrir navegador)

```bash
# 1. TypeScript compila
npx tsc --noEmit
# → DEBE ser 0 errores. Si falla, corregir ANTES de inspeccionar.

# 2. Build exitoso
npm run build
# → DEBE completar sin errores.

# 3. Tests pasan
npm test -- --run
# → DEBE pasar. Si hay tests rotos, corregir primero.
```

Si CUALQUIER prerequisito falla, NO abrir el inspector. Corregir primero.

## SCOPE

**Puerto:** 3004 (unica app, `npm run dev`)

**Scope inteligente:** Basado en lo que se modifico en la sesion.

- Si se toco `features/cierres/` → inspeccionar `/cierres` + `/` (dashboard referencia cierres)
- Si se toco `shared/components/` → inspeccionar TODAS las paginas (impacto global)
- Si se toco `core/services/` → inspeccionar las paginas que consumen ese servicio
- Si se toco `pages/` → inspeccionar la pagina afectada + navegacion
- **Ante duda:** inspeccionar todo

---

## 4 CAPAS DE INSPECCION

### CAPA 1: HEALTH (Salud basica)

Para cada pagina en scope:
1. Navegar a la URL
2. Esperar a que cargue completamente (no loading spinners visibles)
3. Capturar consola del navegador:
   - **Errores JS** → FAIL inmediato
   - **Warnings React** → evaluar severidad
   - **Network 4xx/5xx** → FAIL inmediato
4. Verificar que el contenido principal se renderiza (no pantalla en blanco)
5. Verificar que el sidebar/topbar/bottomnav aparecen correctamente

### CAPA 2: EYES (Verificacion visual)

Si la sesion incluyo cambios visuales:
1. Tomar screenshot de la pagina afectada
2. Verificar layout responsive (desktop + mobile viewport)
3. Verificar que no hay overflow horizontal
4. Verificar que textos no se truncan de forma ilegible
5. Verificar que iconos/imagenes cargan correctamente

### CAPA 3: HANDS (Interaccion)

Para cada pagina en scope:
1. **Inputs:** hacer focus, escribir texto, verificar que responde
2. **Buttons:** hacer click, verificar accion esperada
3. **Modals:** abrir, verificar contenido, cerrar con X y con Escape
4. **Filtros:** aplicar filtro, verificar que la lista se actualiza
5. **Tabs:** cambiar de tab, verificar que el contenido cambia
6. **Selects/Dropdowns:** abrir, seleccionar opcion, verificar
7. **Formularios:** llenar y enviar (si hay datos de prueba disponibles)

### CAPA 4: BRAIN (Flujos completos)

Si la sesion toco logica de negocio, verificar flujos completos:
- **Cierre de caja:** abrir wizard → llenar pasos → verificar totales → (no enviar si datos reales)
- **Crear escandallo:** nueva receta → ingredientes → calcular coste → verificar margenes
- **Inventario:** nuevo conteo → buscar productos → registrar cantidades
- **Documentos:** subir imagen → verificar que OCR procesa → revisar datos extraidos
- **Personal:** ver lista → abrir ficha → verificar datos

---

## WARNINGS CONOCIDOS (IGNORAR)

Estos warnings son esperados y NO son errores:

- React Router future flag deprecation warnings
- DevTools extension messages
- Third-party cookie warnings
- `Download the React DevTools` message
- Vite HMR connection messages en dev

---

## REGISTRO DE PAGINAS

| Ruta | Modulo | Indicadores de carga correcta |
|------|--------|-------------------------------|
| `/` | Dashboard | KPI cards visibles, datos numericos cargados |
| `/almacen` | Almacen | 6 tabs visibles: Existencias, Inventarios, Mermas, Pedidos, Proveedores, Traspasos |
| `/cierres` | Cierres | Lista de cierres O wizard de nuevo cierre |
| `/docs` | Documentos | Area de upload/drag-and-drop visible |
| `/pnl` | P&L | 2 tabs: Resultados, Gastos Fijos |
| `/escandallos` | Escandallos | Lista de recetas/escandallos |
| `/equipo` | Personal | Lista de trabajadores |
| `/configuracion` | Config | Formulario de configuracion del restaurante |
| `/login` | Auth | Formulario de login (email + password) |

---

## FORMATO DEL REPORTE (en espanol)

```markdown
# Reporte Inspector — Sesion #N
Fecha: YYYY-MM-DD | Paginas inspeccionadas: N/N

## Prerequisitos
- tsc --noEmit: OK/FAIL
- npm run build: OK/FAIL
- npm test: OK/FAIL (N tests)

## Resultados por pagina

| Pagina | HEALTH | EYES | HANDS | BRAIN | Notas |
|--------|--------|------|-------|-------|-------|
| / (Dashboard) | OK | OK | OK | N/A | KPIs cargan correctamente |
| /cierres | OK | OK | WARN | OK | Warning: tooltip se corta en mobile |
| /almacen | OK | OK | OK | N/A | 6 tabs funcionan |

## Errores encontrados (si alguno)

| # | Pagina | Capa | Severidad | Descripcion | Estado |
|---|--------|------|-----------|-------------|--------|
| 1 | /cierres | HANDS | P1 | Modal no cierra con Escape | PENDIENTE |

## Resumen
- Paginas OK: N/N
- Errores: N (P0: N, P1: N, P2: N)
- Warnings: N
- Veredicto: APROBADO / NO APROBADO
```

---

## REGLAS DEL INSPECTOR

1. **NO decir "listo" sin ejecutar el inspector.** Es obligatorio.
2. **Si encuentra errores P0/P1:** NO aprobar. Corregir y re-inspeccionar.
3. **Si encuentra solo P2/warnings:** aprobar con nota. Reportar a Aitor.
4. **Scope minimo:** siempre inspeccionar al menos las paginas directamente afectadas.
5. **Scope maximo:** si se toco shared/ o core/, inspeccionar TODAS las paginas.
6. **El inspector NO reemplaza el scanner.** Inspector = funcionalidad. Scanner = calidad de codigo.
7. **Prerequisitos son BLOQUEANTES.** Si tsc o build falla, NO inspeccionar. Corregir primero.
