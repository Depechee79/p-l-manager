# 🛡️ AUDITORÍA DE CALIDAD Y ROLES DE USUARIO (UX/SEGURIDAD)
**Fecha**: 2026-01-01 | **Auditor**: Director de Operaciones / Experto Hostelería

---

## 1. Validación de Calidad (Implementaciones Recientes)

He revisado "con lupa" las últimas actualizaciones (P&L, Dashboard, Cierres, Configuración) buscando "parches" o atajos.

### ✅ Estado: APROBADO CON EXCELENCIA TÉCNICA
Se ha priorizado la arquitectura sólida sobre la solución rápida.

| Módulo | Evaluación | Detalles de Calidad |
|--------|------------|---------------------|
| **P&L (Cuenta Explotación)** | ⭐⭐⭐⭐⭐ | **Estructuralmente Perfecto**. No es una simple tabla visual; calcula KPIs reales (Prime Cost, EBITDA) basándose en datos granulares. Usa componentes reutilizables (`Table`, `Card`) y constantes globales. **Calidad Pro.** |
| **Configuración Grupo** | ⭐⭐⭐⭐⭐ | **Arquitectura Robusta**. Separa claramente "Holding" de "Unidad de Negocio". La interfaz (Glassmorphism) es moderna y la lógica de CRUD es completa. |
| **Wizard Cierres** | ⭐⭐⭐⭐☆ | **UX Muy Mejorada**. El uso de footer "sticky" y secciones colapsables resuelve el problema de usabilidad en móvil. *Nota: Falta conectar con TPV real para automatización total, pero la UX manual es óptima.* |
| **Dashboard Ranking** | ⭐⭐⭐☆☆ | **Visualmente Correcto / Datos Simulados**. La estructura del ranking multi-restaurante está lista y funciona, pero actualmente usa datos aleatorios (`Math.random`). **Acción requerida**: Conectar a base de datos real. |

---

## 2. 🚨 ALERTA CRÍTICA DE SEGURIDAD: Rutas Abiertas

Aunque la UI de roles existe, **la aplicación es actualmente insegura a nivel de navegación**.

*   **El Problema**: En `App.tsx`, todas las rutas están expuestas. No existen "Guards" o protecciones.
*   **El Riesgo**: Un "Camarero" logueado puede escribir manualmente `.../pnl` o `.../configuracion` en la barra del navegador y **ACCEDERÁ** a la pantalla de financieros o configuración.
*   **La Solución (No Parche)**: Implementar un componente `ProtectedRoute` que envuelva las rutas sensibles y verifique el rol antes de renderizar.

---

## 3. Definición de UX por Perfil (User Personas)

Como experto operativo, defino cómo debe comportarse la app EXACTAMENTE para cada perfil. "No es lo mismo gestionar que ejecutar".

### 🦅 PERFIL A: DIRECTOR DE OPERACIONES (GRUPO)
*El que mira desde arriba. Necesita comparativas y control.*

*   **UX Clave**: **"Multi-Tenant Real"**
*   **Dashboard**:
    *   **NO QUIERE** ver el detalle de caja de hoy del local X.
    *   **QUIERE** ver un Ranking: "¿Quién va ganando/perdiendo hoy?". Tabla comparativa de Ventas, Labor Cost % y Descuadres.
    *   **Alertas**: Solo desviaciones graves (>10% Food Cost, Descuadres > 50€).
*   **P&L**:
    *   Vista predeterminada: **Consolidado (Suma de todos)**.
    *   Capacidad de Drill-down: Click en local -> Ver P&L individual.
*   **Configuración**:
    *   Acceso TOTAL. Crea restaurantes, define impuestos globales y categorías contables.
*   **Horarios/Personal**:
    *   Visión financiera: Coste total de personal vs Ventas. No le importa quién trabaja mañana en el turno de noche.

### 🦁 PERFIL B: MANAGER DE RESTAURANTE (DIRECTOR LOCAL)
*El que está en el terreno. Gestiona 1 unidad. Responsable de la rentabilidad local.*

*   **UX Clave**: **"Foco Operativo"** (Sin ruido de otros locales)
*   **Dashboard**:
    *   Solo ve SU restaurante.
    *   KPIs inmediatos: Venta de Hoy vs Ayer, Venta vs Presupuesto.
*   **Cierres**:
    *   Es quien **VALIDA** los cierres de los cajeros. Recibe alertas de descuadres al momento.
*   **Inventarios**:
    *   Programa los inventarios y revisa las variaciones (Mermas desconocidas). Ve precios y valores monetarios del stock.
*   **Horarios**:
    *   **Creador**. Interfaz de "Planificador" (Drag & drop). Asigna turnos, aprueba vacaciones.
*   **Restricción Férrea**: Si intenta acceder a `/configuracion` (datos fiscales del grupo) o datos de OTRO restaurante -> **Acceso Denegado**.

### 🐝 PERFIL C: STAFF (CAMARERO / BARRA / COCINA)
*El que ejecuta la tarea. Móvil en mano, rápido.*

*   **UX Clave**: **"Tarea Única"** (Interfaz simplificada)
*   **Dashboard**:
    *   **NO DEBE VER DASHBOARD FINANCIERO**.
    *   Su "Home" debe ser: "Mi Turno Hoy" + Acceso directo a "Nuevo Cierre" o "Nuevo Inventario".
*   **Inventarios**:
    *   **UX Ciega**: Solo ve "Producto" y campo "Cantidad".
    *   **NO VE**: Ni coste unitario, ni valor total, ni stock teórico (para evitar que "cuadren" el inventario a ojo).
*   **Cierres**:
    *   Acceso solo al Wizard de Cierre. Al terminar, ve un resumen simple ("Cierre completado"). No ve historial financiero.
*   **Horarios**:
    *   Vista "Consumidor": Calendario con mis turnos. Botón gigante "Fichar Entrada/Salida". Nada de editar.

---

## 4. Matriz de Permisos Recomendada

| Módulo / Acción | 🦅 Dir. Operaciones | 🦁 Manager Local | 🐝 Staff (Camarero) |
|:----------------|:-------------------:|:----------------:|:-------------------:|
| **Dashboard** | ✅ Ranking Grupo | ✅ Solo Local | ❌ (Solo Home Tareas) |
| **P&L (Ver)** | ✅ Completo | ✅ Solo Local | ❌ Bloqueado |
| **Config. Fiscal**| ✅ Edición Total | ❌ Lectura (o web) | ❌ Bloqueado |
| **Cierres** | ✅ Histórico | ✅ Valida/Edita | ⚠️ Solo Crear Nuevo |
| **Inventarios** | ✅ Audit | ✅ Valorados (€) | ⚠️ Ciegos (Solo Ud.)|
| **Personal** | ✅ Costes | ✅ Planificador | ⚠️ "Mi Perfil" |
| **Usuarios** | ✅ Admin Total | ⚠️ Solo su Staff | ❌ Bloqueado |

---

## 5. Próximos Pasos (Hoja de Ruta de Calidad)

Para elevar la app al nivel "Profesional Enterprise":

1.  **Seguridad (URGENTE)**: Implementar `RoleBasedRoute` en `App.tsx` para bloquear URLs por rol.
2.  **Seguridad Datos**: Asegurar en Firebase/Backend que las consultas (`usePnl`, `useDashboard`) filtren por `restaurantId` en el servidor (o reglas de seguridad), no solo en el frontend.
3.  **UX Inventario Ciego**: Crear vista de inventario para Staff que oculte columnas de precios y stock teórico.
4.  **UX Dashboard Staff**: Crear una "Home" específica para empleados sin gráficas financieras.

**Conclusión**: La base construida es **sólida y de alta calidad**. El sistema multi-restaurante funciona. Solo falta la capa de seguridad y la especialización de vistas por rol para ser una herramienta operativa real.
