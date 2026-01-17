# 🔍 AUDITORÍA TÉCNICA - P&L Manager
## Hallazgos de Auditoría por Director de Operaciones de Hostelería
**Fecha**: 2026-01-01 | **Perfil Auditor**: Experto en cadenas de 25 restaurantes

---

## 📊 Resumen Ejecutivo

| Aspecto | Puntuación | Estado |
|---------|------------|--------|
| **Global** | 7.5/10 | 🟡 Mejorable |
| Usabilidad Móvil | 9/10 | 🟢 Excelente |
| Operaciones Caja | 8/10 | 🟢 Bueno |
| Control Costes | 6/10 | 🟡 Incompleto |
| Reporting Financiero | 5/10 | 🔴 Crítico |
| Gestión Personal | 4/10 | 🔴 Crítico |
| Inventario | 6/10 | 🟡 Funcional |

---

## 🔴 HALLAZGOS CRÍTICOS

### 1. P&L Incompleto (PnLPage.tsx)

**Problema**: El estado de pérdidas y ganancias solo incluye:
- Ingresos Operativos (Local/Delivery)
- Gastos Operativos (Compras Comida/Bebida)

**Falta** (crítico para gestión real):
- ❌ Gastos de Personal (Labor Cost) → 30-35% de costes
- ❌ Alquileres y Gastos Fijos → ~10% costes
- ❌ Suministros (Luz, Gas, Agua)
- ❌ Marketing
- ❌ Mantenimiento

**Impacto**: El EBITDA mostrado NO es real. Es solo margen sobre compras.

**Archivo**: `src/pages/PnLPage.tsx`

---

### 2. Sin Vista Multi-Restaurante

**Problema**: Dashboard no tiene:
- Selector de local
- Agregación "Todos los locales"
- Ranking por KPI
- Comparativa entre restaurantes

**Impacto**: Inviable para empresa de 25 restaurantes.

**Archivos**: 
- `src/pages/DashboardPage.tsx`
- `src/core/context/RestaurantContext.tsx`

---

### 3. Sin Comparativa vs Presupuesto

**Problema**: No existe módulo de presupuestos ni visualización de desviaciones.

**Impacto**: Director no puede saber si está cumpliendo objetivos.

---

## 🟠 HALLAZGOS DE USABILIDAD

### 4. Wizard Cierres - Scroll Excesivo

**Ubicación**: `src/features/cierres/components/wizard/steps/CashCountingStep.tsx`

**Problema**: 
- Paso 2 tiene ~20 inputs (todas las denominaciones)
- Botón "Siguiente" solo visible tras scroll completo
- En móvil requiere mucho tiempo

**Solución propuesta**:
- Secciones colapsables (Billetes/Monedas)
- Botón flotante sticky en footer

---

### 5. Inventario Sin Escáner

**Ubicación**: `src/pages/InventariosPage.tsx`, `src/features/inventarios/`

**Problema**:
- Solo input de texto para buscar producto
- Requiere escribir con teclado
- Lento para inventario físico real

**Solución propuesta**:
- Integrar `html5-qrcode` para escaneo de EAN
- Botones +/- para cantidades

---

### 6. OCR Sin Captura Directa

**Ubicación**: `src/pages/OCRPage.tsx`

**Problema**:
- Solo permite "Subir archivo"
- No hay botón "Hacer foto"
- En móvil, flujo subóptimo

**Solución propuesta**:
- Acceso directo a cámara
- `<input type="file" accept="image/*" capture="environment">`

---

## 🟡 HALLAZGOS MENORES

### 7. Error Ortográfico

**Ubicación**: `src/pages/MenuEngineeringPage.tsx`

**Problema**: "Rompecabezass" (sobra una 's')

**Solución**: Buscar y reemplazar texto.

---

### 8. Ingeniería Menú Limitada

**Problema**:
- Solo muestra contadores por categoría
- No hay lista de platos al hacer click
- Falta gráfico scatter interactivo

---

### 9. Alertas Inexistentes

**Problema**: No hay sistema de notificaciones para:
- Descuadres importantes
- Stocks bajos
- Facturas duplicadas

---

## 📁 Arquitectura Actual (Referencia)

```
src/
├── features/
│   ├── cierres/          # ✅ Bien estructurado
│   ├── dashboard/        # ⚠️ Falta multi-local
│   ├── inventarios/      # ⚠️ Falta escáner
│   ├── ocr/              # ⚠️ Falta cámara directa
│   └── ...
├── pages/
│   ├── PnLPage.tsx       # 🔴 CRÍTICO - Incompleto
│   ├── DashboardPage.tsx # 🔴 CRÍTICO - Sin multi-local
│   ├── MenuEngineeringPage.tsx  # 🟡 Typo + mejoras
│   └── ...
├── shared/
│   └── components/       # ✅ Bien diseñado
└── core/
    └── context/          # ⚠️ Falta multi-tenant
```

---

## 🔗 Documentos Relacionados

- [AUDIT_BACKLOG.md](./AUDIT_BACKLOG.md) - Tareas priorizadas
- [AUDIT_PROMPT.md](./AUDIT_PROMPT.md) - Prompt para desarrollador
- [RULES.md](./RULES.md) - Reglas de arquitectura
- [HANDOFF.md](./HANDOFF.md) - Estado del proyecto

---

**Próxima revisión**: Tras implementación de AUDIT-01 y AUDIT-02
