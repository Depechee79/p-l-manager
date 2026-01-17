# 🕵️ AUDITORÍA "FORENSE" DE OPERACIONES - P&L MANAGER
**Nivel de Detalle**: Exhaustivo (Código + UX + Seguridad)
**Fecha**: 2026-01-01
**Auditor**: Lead Full-Stack Engineer & Ex-Director Operaciones

---

## 🚨 RESUMEN EJECUTIVO: "Sólida Estructura, Seguridad de Papel"

La aplicación tiene una arquitectura de código moderna, limpia y escalable (React 18 + TS), pero falla dramáticamente en dos pilares básicos para una cadena de 25 locales: **Seguridad de Acceso** e **Integridad de Datos Financieros**. Visualmente parece terminada, pero operativamente tiene "agujeros" que impedirían un despliegue real mañana.

### 🛑 Semáforo de Estado

| Área | Estado | Diagnóstico Rápido |
|------|--------|-------------------|
| **Seguridad** | 🔴 CRÍTICO | **Cualquier usuario puede ver TODO**. No existen protecciones de ruta. |
| **Finanzas (P&L)** | 🟠 GRAVE | **Estructura fantasma**. El reporte P&L está bien diseñado, pero los gastos (Personal, Alquiler) están hardcodeados a `0`. |
| **Operativa** | 🟡 ALERTA | **Scanner sin EAN**. El escáner funciona pero busca por "Nombre" o "ID interno", inútil en operativa real. |
| **UX Móvil** | 🟢 EXCELENTE | El diseño "sticky" y los componentes táctiles son de primera clase. |

---

## 1. 🛡️ AUDITORÍA DE SEGURIDAD (Vulnerabilidad #1)

### Hallazgo: Ausencia de "Route Guards"
**Archivo**: `src/App.tsx`
**Evidencia**:
```typescript
<Routes>
  <Route path="/" element={<DashboardPage />} />
  <Route path="/pnl" element={<PnLPage />} /> {/* ⚠️ ACCESIBLE POR CUALQUIERA */}
  <Route path="/configuracion" element={<RestaurantConfigPage />} /> {/* ⚠️ PELIGRO */}
</Routes>
```
**Impacto Operativo**:
Un camarero enfadado, o simplemente curioso, puede escribir `app.com/pnl` en su navegador móvil y accederá a la cuenta de resultados completa del grupo. Puede entrar a `app.com/configuracion` y cambiar el IVA o el nombre de la empresa.
**Solución Requerida**: Implementar componente `ProtectedRoute` que verifique `user.role` contra una matriz de permisos.

### Hallazgo: Aislamiento de Datos (Multi-Tenant)
**Archivo**: `src/core/hooks/useRestaurant.ts`
**Estado**: 🟡 Parcialmente Seguro (Client-Side)
La aplicación descarga **TODOS** los datos de Firebase (`db.cierres`, `db.facturas`) al cliente y luego filtra por `restaurantId` usando Javascript (`.filter()`).
*   **Riesgo**: Un usuario con conocimientos técnicos (F12 DevTools) puede inspeccionar el objeto `db` en memoria y ver los datos de los otros 24 restaurantes.
*   **Mitigación MVP**: Aceptable para fase 1, pero inaceptable para Enterprise. Requiere reglas de seguridad en Firebase (Firestore Rules).

---

## 2. 💰 AUDITORÍA FINANCIERA (P&L - "El Dinero")

### Hallazgo: Gastos "Fantasma"
**Archivo**: `src/services/pnl-service.ts`
**Evidencia**:
```typescript
// 😱 HARDCODED PERMANENTE
const salarios = 0;
const alquiler = 0;
const suministros = 0;
```
**Impacto Operativo**:
El Director de Operaciones verá un **EBITDA Falso**. El sistema calcula el Margen Bruto (Ventas - Comida) correctamente, pero luego asume que el Personal y el Alquiler son GRATIS. El beneficio neto mostrado es irrealmente alto.
**Falta**: Módulo de entrada de gastos fijos (recurrente) y variable (nóminas mensuales).

---

### Hallazgo: Dashboard - Contadores Simulados
**Archivo**: `src/features/dashboard/hooks/useDashboardMetrics.ts`
**Evidencia**:
```typescript
const facturasPendientes = 0; // Placeholder
platosVendidos: 0, // Placeholder
```
**Impacto**: Las alertas de "Facturas pendientes" nunca saltarán, dando falsa sensación de tranquilidad.

---

## 3. 📦 AUDITORÍA OPERATIVA (Inventarios & Cierres)

### Hallazgo: Escáner de Códigos de Barras
**Archivo**: `src/features/inventarios/components/ProductScanner.tsx`
**Estado Técnico**: ✅ Implementado (`html5-qrcode`).
**Fallo Operativo**: ❌ Falta campo EAN.
El escáner lee el código, pero el sistema busca:
```typescript
products.find(p => String(p.id) === decodedText || p.nombre === decodedText)
```
En la vida real, una botella de Coca-Cola tiene un código EAN (5449000...). El sistema actual espera que el ID interno de la base de datos coincida con el código de barras, o que el código de barras sea el nombre "Coca Cola". **Esto no funcionará en el mundo real**.
**Solución**: Añadir campo `ean` o `barcode` a la entidad `Product`.

### Hallazgo: Inventario "Ciego" (Blind Mode)
**Archivo**: `CountingStep.tsx`
**Estado**: ✅ Correcto.
El componente **NO** renderiza en ningún momento el coste o precio del producto.
*   **Ventaja**: El staff puede contar sin saber el valor del stock (prevención de fraude/ajustes "a ojo").
*   **Nota**: Es seguro por omisión de UI, lo cual es válido.

---

## 4. 👤 SIMULACIÓN DE ROLES (User Journey)

### 🦅 Perfil: DIRECTOR DE OPERACIONES
1.  **Entra al Dashboard**: Ve el ranking (⚠️ Datos simulados `Math.random` en `DashboardPage.tsx`). No sirve para tomar decisiones reales hoy.
2.  **Consulta P&L**: Ve un margen del 70% porque faltan los salarios (Labor = 0%). **Informe Financiero Inútil**.
3.  **Configuración**: Intenta crear un nuevo local. Funciona perfecto (✅).

### 🦁 Perfil: MANAGER DE RESTAURANTE
1.  **Cierre de Caja**: Usa el Wizard. Es rápido, los billetes se suman solos. (✅ Excelente).
2.  **Inventario Semanal**: Usa el escáner. Escanea una botella. El sistema dice "No encontrado" porque busca el ID interno, no el EAN. Tiene que buscar manual. (❌ Frustración).

### 🐝 Perfil: CAMARERO
1.  **Login**: Entra con su usuario.
2.  **Travesura**: Escribe `/configuracion` en la URL.
3.  **Resultado**: Accede al panel de administración fiscal del grupo. (❌ **FAIL DE SEGURIDAD**).

---

## 📋 PLAN DE ACCIÓN RECOMENDADO ("Roadmap de Calidad")

Para salir del estado de "Prototipo Avanzado" a "Producto Real", se deben ejecutar estas 3 fases estricas:

### FASE 1: CANDADO DE SEGURIDAD (Inmediato - 4h)
1.  Crear componente `ProtectedRoute`.
2.  Envolver rutas sensibles en `App.tsx`.
3.  Validar que un usuario 'Camarero' sea redirigido a `/` si intenta acceder a `/pnl`.

### FASE 2: VERDAD FINANCIERA (1-2 días)
1.  Crear tabla/colección `GastosFijos` (Alquiler, Luz, Agua).
2.  Crear tabla/colección `Nominas` (Mes, Empleado, Importe).
3.  Conectar `PnLService` a estas tablas para eliminar los `const salarios = 0`.

### FASE 3: REALIDAD OPERATIVA (1 día)
1.  Añadir campo `barcode` a `Product`.
2.  Actualizar lógica de escáner para buscar por `barcode`.
3.  Conectar Ranking del Dashboard a datos reales del contexto.

---

**Conclusión del Auditor**:
La aplicación es un "Ferrari sin puertas y con el indicador de gasolina roto". El motor (React/Core) es potente, el chasis (UI) es precioso, pero cualquiera puede entrar (Seguridad) y el conductor no sabe cuánto combustible tiene (P&L incompleto). **Prioridad absoluta a FASE 1 y 2.**
