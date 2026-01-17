<!-- 9e959c72-bb56-4b9b-958e-aaed95c336a7 062da96d-d9a9-40da-b833-a5019634576f -->
# Plan de Testing de Problemas Reportados

## Objetivo

Crear un sistema de verificación exhaustivo que detecte todos los problemas reportados y asegure que las correcciones se reflejen correctamente en la aplicación web.

## Problemas Reportados (Lista Completa)

### 1. Errores de Compilación/Carga

- **Problema**: La aplicación no carga debido a errores de JSX, imports duplicados, o propiedades incorrectas
- **Archivos afectados**: `CierresPage.tsx`, `EscandallosPage.tsx`, `InventoryPage.tsx`
- **Verificación**: Build debe completarse sin errores

### 2. DatePicker/TimePicker

- **Problema**: No se abre el picker al hacer clic en cualquier parte del input, falta de estilos
- **Archivos**: `src/components/DatePicker.tsx`, `src/components/TimePicker.tsx`
- **Verificación**: Click en cualquier parte del input debe abrir el picker nativo, estilos aplicados correctamente

### 3. Elementos UI Desproporcionados

- **Problema**: Inputs, botones y campos de texto demasiado grandes
- **Archivos**: `src/index.css`, todas las páginas
- **Verificación**: Altura máxima de inputs: 40px, padding reducido, proporciones correctas

### 4. Diseño de Cards

- **Problema**: Diseño no gusta, bandas de color (ya eliminadas)
- **Archivos**: `src/index.css`, `src/pages/*.tsx`
- **Verificación**: Sin `borderLeft` en cards, padding y sombras consistentes

### 5. Función "Nuevo Cierre"

- **Problema**: Formulario demasiado grande, inputs de moneda desproporcionados
- **Archivo**: `src/pages/CierresPage.tsx`
- **Verificación**: Vista compacta única, label a la izquierda e input a la derecha en campos de moneda

### 6. Datos de Ejemplo

- **Problema**: Se muestran datos que no existen en Firebase
- **Archivos**: `src/hooks/useProviders.ts`, `src/hooks/useInvoices.ts`, `src/hooks/useFinance.ts`, `src/hooks/useInventory.ts`, `src/pages/OCRPage.tsx`
- **Verificación**: Solo datos con `_synced === true` o IDs de Firebase (string > 10 caracteres)

### 7. Inputs de Selección Manual

- **Problema**: Inputs permiten entrada manual en lugar de solo selección
- **Archivos**: `src/pages/InventoryPage.tsx`, `src/pages/EscandallosPage.tsx`, `src/pages/CierresPage.tsx`
- **Verificación**: Campos de familia, subfamilia, categoría, etc. deben usar `SelectWithAdd` o `Select`

### 8. Popups con Diseño Antiguo

- **Problema**: Modales no tienen el diseño moderno
- **Archivos**: `src/components/Modal.tsx`, `src/index.css`
- **Verificación**: Backdrop blur, animaciones, sombras modernas

### 9. Selección de Tipo de Documento (OCR)

- **Problema**: Diseño demasiado grande, necesita ser más compacto
- **Archivo**: `src/pages/OCRPage.tsx`
- **Verificación**: Grid 2x2 compacto, iconos más pequeños, sin flechas laterales

### 10. Card de Conteo en Inventario

- **Problema**: Card de conteo debe estar arriba, lista de productos debajo
- **Archivo**: `src/pages/InventoryPage.tsx`
- **Verificación**: Layout correcto cuando `isCountingInventory === true`

### 11. Indicador de Unidad en Conteo

- **Problema**: En conteo por packs/cajas/mallas, falta indicar qué se cuenta (botella, kg, latas)
- **Archivo**: `src/pages/InventoryPage.tsx`
- **Verificación**: Campo "Unidad contenida" visible cuando `metodoRecepcion !== 'unitario'`

## Estrategia de Testing

### Fase 1: Tests Automatizados de Compilación

- Script que verifica que `npm run build` completa sin errores
- Verificación de tipos TypeScript
- Verificación de sintaxis JSX

### Fase 2: Tests de Integridad de Datos

- Verificar que todos los hooks filtran correctamente datos de Firebase
- Verificar que no se muestran datos de ejemplo
- Tests unitarios para cada hook de datos

### Fase 3: Tests de Componentes UI

- Tests de `DatePicker` y `TimePicker` para verificar click handlers
- Tests de `SelectWithAdd` para verificar funcionalidad
- Tests de `Modal` para verificar estilos

### Fase 4: Tests Visuales/Regresión

- Script que verifica estilos CSS aplicados
- Verificación de que no existen `borderLeft` en cards
- Verificación de tamaños de inputs/buttons

### Fase 5: Tests E2E de Flujos Críticos

- Flujo completo de "Nuevo Cierre"
- Flujo de OCR (selección de tipo de documento)
- Flujo de inventario (conteo de productos)

## Archivos a Crear/Modificar

1. **`test-regression-suite.js`**: Script principal que ejecuta todos los tests de regresión
2. **`test-build-errors.js`**: Verifica errores de compilación
3. **`test-data-integrity.js`**: Verifica integridad de datos (Firebase only)
4. **`test-ui-components.js`**: Verifica componentes UI (DatePicker, Select, Modal)
5. **`test-visual-consistency.js`**: Verifica estilos CSS y consistencia visual
6. **`test-e2e-flows.js`**: Tests E2E de flujos críticos
7. **`REGRESSION_TEST_REPORT.md`**: Reporte consolidado de todos los tests

## Criterios de Éxito

Cada problema debe tener:

- ✅ Test automatizado que verifica la corrección
- ✅ Verificación manual documentada
- ✅ Confirmación de que se refleja en la web después del build

## Ejecución

```bash
# Ejecutar todos los tests de regresión
node test-regression-suite.js

# Ejecutar tests específicos
node test-build-errors.js
node test-data-integrity.js
node test-ui-components.js
node test-visual-consistency.js
node test-e2e-flows.js
```

## Reporte

El reporte final debe mostrar:

- Estado de cada problema (✅ Resuelto / ❌ Pendiente)
- Errores encontrados durante el testing
- Recomendaciones para problemas no resueltos

### To-dos

- [ ] Crear sistema de diseño base: paleta de colores refinada, tipografía escalable, tokens de diseño, componentes base mejorados (Input, Select, DatePicker, Button, Card, Modal)
- [ ] Implementar mobile-first responsive: breakpoints, navegación móvil optimizada, teclados numéricos grandes, touch targets adecuados
- [ ] Crear nueva página Dashboard con KPI cards, gráficos, accesos rápidos, actividad reciente y alertas
- [ ] Mejorar OCRPage: flujo wizard step-by-step, mejoras en reconocimiento OCR, lista con filtros autocompletados, formulario agrupado lógicamente
- [ ] Mejorar CierresPage: flujo step-by-step, conteo de efectivo mejorado, sistema dinámico de métodos de pago, tabla de cuadre visual
- [ ] Mejorar ProvidersPage: filtro autocompletado universal, formulario agrupado, tabla ordenable clickeable
- [ ] Renombrar y mejorar InventoryPage a Almacén: filtros mejorados, formulario con lógica de recepción, tabla optimizada
- [ ] Mejorar EscandallosPage: flujo step-by-step, selección de ingredientes mejorada, cálculos en tiempo real, tabla con filtros
- [ ] Crear nueva página InventariosPage: creación de inventario, flujo de conteo móvil, gestión de conteos múltiples, lista de inventarios
- [ ] Mejorar PnLPage: dashboard mejorado, comparativas y desviaciones, tabla mejorada con exportación
- [ ] Mejorar componente Table: filas clickeables completas, cabeceras ordenables visuales, responsive mejorado
- [ ] Mejorar todos los formularios: jerarquía visual, agrupación lógica, validación en tiempo real, estilos consistentes
- [ ] Mejorar Layout y navegación: sidebar mejorado, breadcrumbs, mobile navigation optimizada
- [ ] Crear componentes DatePicker y TimePicker personalizados y estilizados consistentemente
- [ ] Implementar sistema de notificaciones toast para feedback visual en todas las acciones
- [ ] Crear test-build-errors.js para verificar errores de compilación y carga
- [ ] Crear test-data-integrity.js para verificar que solo se muestran datos de Firebase
- [ ] Crear test-ui-components.js para verificar DatePicker, TimePicker, SelectWithAdd, Modal
- [ ] Crear test-visual-consistency.js para verificar estilos CSS y consistencia visual
- [ ] Crear test-e2e-flows.js para verificar flujos críticos (Nuevo Cierre, OCR, Inventario)
- [ ] Crear test-regression-suite.js que ejecuta todos los tests y genera reporte consolidado
- [ ] Ejecutar todos los tests y generar reporte final REGRESSION_TEST_REPORT.md