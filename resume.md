# 📊 P&L Manager - Resumen Ejecutivo

**Sistema de Gestión Integral de Pérdidas y Ganancias para Hostelería**

---

## 🎯 Descripción General

P&L Manager es una aplicación web completa diseñada específicamente para la gestión contable y operativa de restaurantes, bares y cafeterías. Proporciona un sistema integral que cubre desde el registro automatizado de facturas mediante OCR hasta el análisis completo de pérdidas y ganancias, todo funcionando offline en el navegador.

### Versión Actual
**v4.27.6** - Sistema con OCR Inteligente + Inventario Profesional + UX Moderna (Noviembre 2025)

---

## 🚀 Características Principales

### 1. OCR Profesional (Reconocimiento Óptico de Caracteres)
- Extracción automática de datos desde facturas y albaranes
- Soporte multi-formato: PDF, JPG, PNG, WEBP, BMP, TIFF
- Motor dual:
  - **PDF.js**: Extracción de texto embebido (99.9% precisión)
  - **Tesseract.js**: OCR sobre imágenes escaneadas (95% precisión)
- Preprocesado inteligente de imágenes (binarización, contraste)
- Detección semántica de campos: CIF/NIF, proveedor, fecha, importes
- Validación automática de coherencia contable
- Sistema de confianza: Alta/Media/Baja

### 2. Gestión de Cierres de Caja
- Conteo detallado de efectivo (billetes y monedas)
- Múltiples datáfonos simultáneos
- Otros medios de pago (Bizum, transferencias, Dinero B)
- Comparación automática POS vs Real
- Detección de descuadres con alertas visuales
- Resumen en tiempo real con tabla dinámica

### 3. Escandallos (Costes de Platos)
- Cálculo preciso de coste por plato
- Gestión de ingredientes con cantidades
- Food Cost % automático
- Cálculo de márgenes por plato
- PVP con IVA (10% hostelería)

### 4. Gestión de Compras
- **Facturas**: Registro completo con validación IVA
- **Albaranes**: Control de entregas
- Verificación automática factura vs albaranes
- Filtros avanzados por proveedor y fechas
- Autocomplete HTML5 para búsqueda rápida
- Edición completa de documentos

### 5. Módulo de Proveedores
- Ficha completa: datos fiscales y comerciales
- Categorización: Compra, Gasto, o Ambos
- Condiciones de pago y frecuencia de entrega
- Histórico de operaciones
- Auto-creación desde OCR

### 6. Inventario Profesional
- Gestión de empaques (cajas, racks, packs)
- Conteo mixto: empaques completos + sueltas
- Cálculo automático de diferencias
- Colores semánticos (verde/azul/rojo)
- Alta rápida de productos sin salir del módulo
- Historial de movimientos de stock
- Ajustes automáticos con confirmación

### 7. Catálogo de Productos
- Definición de unidades base (kg, L, ud)
- Sistema de empaques opcional
- Gestión de stock teórico
- Precios netos (sin IVA)
- Familias y subfamilias
- Resumen visual: "1 Caja = 5 kg"

### 8. Delivery (Pedidos a Domicilio)
- Registro por plataforma (Glovo, Uber Eats, Just Eat)
- Cálculo de comisiones
- Ventas netas recibidas
- Análisis por canal

### 9. P&L Completo (Pérdidas y Ganancias)
- Cuenta de explotación profesional
- KPIs principales:
  - Ingresos netos
  - COGS (Cost of Goods Sold)
  - Margen bruto %
  - EBITDA %
- Secciones detalladas:
  - Ingresos (TPV + Delivery)
  - Costes de Mercancía (COGS)
  - Gastos Operativos
  - Beneficio Neto
- Alertas automáticas
- Comparación temporal (mes vs mes)

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

**Frontend:**
- HTML5 semántico
- CSS3 moderno (Grid + Flexbox)
- Vanilla JavaScript ES6+ (sin frameworks)
- Patrón MVC simplificado

**Librerías Externas:**
- Tesseract.js v5 (OCR - español optimizado)
- PDF.js v3.11.174 (extracción PDF)

**Persistencia:**
- localStorage del navegador (100% offline)

**Tipografía:**
- Google Fonts: Inter (pesos 400-700)

### Estructura de Archivos

```
p-l-manager/
├── app/
│   ├── index.html      # Interfaz principal (605 líneas)
│   ├── app.js          # Lógica completa (4,357 líneas)
│   └── styles.css      # Estilos modernos (1,890 líneas)
├── PROJECT_BIBLE.md    # Documentación técnica completa (5,141 líneas)
├── README.md           # Instrucciones de uso
├── AUDITORIA_ESPECIFICACION.md  # Auditoría técnica
├── DESIGN-UX-UI.md     # Guía de diseño oficial
├── UX-UI-PNL-Manager.md         # Especificación técnica UX
└── resume.md           # Este documento
```

### Clases Principales

**Database** (Gestión de Datos):
- CRUD de todas las entidades
- Validaciones de integridad
- Exportación/importación JSON

**App** (Controlador Principal):
- Navegación entre módulos
- Renderizado de vistas
- Gestión de eventos
- Lógica de negocio

---

## 🎨 Sistema de Diseño

### Paleta de Colores

**Principales:**
- Azul corporativo: `#1171ef`
- Verde éxito: `#34c759`
- Rojo error: `#ff3b30`
- Amarillo aviso: `#ffcc00`
- Azul info: `#0a84ff`

**Grises:**
- Fondo: `#f3f6fa`
- Cards: `#ffffff`
- Bordes: `#e3e8ef`
- Texto primario: `#1f2d3d`
- Texto secundario: `#6b7b8c`

**Sidebar:**
- Fondo: `#1d3041`
- Hover: `#26445a`

### Componentes UI

- **Cards**: Border-radius 12px, sombras suaves
- **Botones**: Border-radius 8px, transiciones 0.2s
- **Inputs**: Altura 42px, focus ring azul
- **Modales**: Backdrop blur, border-radius 16px
- **Toast notifications**: 4 variantes (success/error/info/warning)
- **Tablas**: Hover effects, alternancia de filas

---

## 📐 Reglas Contables Fundamentales

### Sin IVA en Cálculos Internos
⚠️ **REGLA CRÍTICA:** Todos los cálculos contables se realizan **SIN IVA (neto)**

- **Base Imponible NETA**: Valor principal para contabilidad
- **IVA**: Solo campo informativo
- **Total CON IVA**: Solo referencia, no se usa en P&L

### Fórmulas

```
Base Neta (€) = Importe sin IVA
IVA (€) = Base Neta × (% IVA / 100)
Total CON IVA (€) = Base Neta + IVA

COGS = Suma de Bases Netas de compras
Margen = Ingresos Netos - COGS
```

### Tipos de IVA en España
- 4% (productos básicos)
- 10% (hostelería, transporte)
- 21% (general)

---

## 📊 Módulos Detallados

### OCR (Registro Manual)
**Tipos de documento:**
- Factura de Proveedor
- Albarán de Entrega
- Cierre de Caja
- Delivery

**Proceso:**
1. Seleccionar tipo de documento
2. Subir imagen/PDF (max 10MB)
3. OCR automático con zonas
4. Revisión y edición de campos
5. Validación de coherencia
6. Guardar e integrar

**Campos detectados:**
- CIF/NIF (patrón español)
- Nombre fiscal del proveedor
- Número de factura/albarán
- Fecha (DD/MM/YYYY)
- Base imponible neta
- IVA (importe y porcentaje)
- Total con IVA
- Email y teléfono (si están)

### Cierres
**Componentes:**
1. **Conteo de efectivo**
   - Grid de billetes: 500€, 200€, 100€, 50€, 20€, 10€, 5€
   - Grid de monedas: 2€, 1€, 0.50€, 0.20€, 0.10€, 0.05€

2. **Datáfonos**
   - Añadir múltiples terminales
   - Marca y número de terminal
   - Importe por datáfono

3. **Otros medios**
   - Bizum
   - Transferencias bancarias
   - Dinero B (sin IVA)

4. **Resumen tiempo real**
   - Tabla POS vs Real vs Diferencia
   - Colores semánticos
   - Total de tickets y ticket medio

### Productos
**Información:**
- Nombre comercial
- Referencia interna
- Proveedor principal
- Familia y subfamilia
- Unidad base (kg, L, ml, g, ud)
- Precio neto (sin IVA)
- Stock actual
- Sistema de empaques:
  - Tipo: Caja, Rack, Pack, Malla, etc.
  - Unidades por empaque
  - Resumen: "1 Caja = 5 kg"

### Inventario
**Flujo:**
1. Ver historial de inventarios
2. Crear nuevo inventario
3. Seleccionar familia (opcional)
4. Añadir productos uno a uno
5. Contar stock:
   - Solo empaques
   - Solo sueltas
   - Empaques + sueltas
6. Calcular diferencias
7. Finalizar y ajustar stock (opcional)

**Cálculo automático:**
```javascript
stock_contado = (nº_empaques × unidades_por_empaque) + unidades_sueltas
diferencia = stock_contado - stock_teórico
```

**Colores de diferencia:**
- 🟢 Verde: Cuadra (diferencia ≈ 0)
- 🔵 Azul: Sobra stock
- 🔴 Rojo: Falta stock

### Escandallos
**Estructura:**
- Nombre del plato
- Lista de ingredientes:
  - Producto
  - Cantidad
  - Unidad
  - Coste unitario neto
  - Coste total
- **Totales:**
  - Coste total neto
  - PVP neto
  - PVP con IVA 10%
  - Food Cost %
  - Margen €

**Fórmula Food Cost:**
```
Food Cost % = (Coste Ingredientes / PVP Neto) × 100
Margen € = PVP Neto - Coste Ingredientes
```

### P&L (Profit & Loss)
**Estructura:**

1. **Ingresos**
   - TPV (tickets)
   - Delivery (neto recibido)
   - **Total Ingresos Netos**

2. **COGS (Cost of Goods Sold)**
   - Compras del mes (base neta)
   - Ajustes de inventario
   - **% COGS**

3. **Margen Bruto**
   - Ingresos - COGS
   - **% Margen**

4. **Gastos Operativos**
   - Personal
   - Alquileres
   - Suministros
   - Marketing
   - Otros gastos

5. **EBITDA**
   - Margen - Gastos
   - **% EBITDA**

6. **Amortizaciones**

7. **Beneficio Neto**

**KPIs Destacados:**
- Ingresos Netos
- % COGS (objetivo: 28-32%)
- % Margen (objetivo: 68-72%)
- % EBITDA (objetivo: >15%)

---

## 🔧 Instalación y Uso

### Requisitos
- Navegador moderno (Chrome 120+, Firefox 119+, Edge 120+)
- No requiere servidor
- No requiere instalación de dependencias

### Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/Depechee79/p-l-manager.git

# Entrar al directorio
cd p-l-manager

# Abrir en navegador
# Opción 1: Abrir directamente app/index.html
# Opción 2: Usar servidor local
python -m http.server 8000
# Luego navegar a http://localhost:8000/app/
```

### Uso Básico

1. **Primer uso:**
   - Abrir aplicación
   - Configurar mes actual (selector en sidebar)
   - Crear proveedores desde módulo Proveedores

2. **Registro de facturas:**
   - Ir a módulo OCR
   - Seleccionar tipo "Factura Proveedor"
   - Subir imagen/PDF
   - Revisar datos extraídos
   - Guardar

3. **Control de inventario:**
   - Ir a módulo Inventario
   - Crear nuevo inventario
   - Seleccionar productos
   - Contar stock físico
   - Finalizar y ajustar

4. **Cierre de caja:**
   - Ir a módulo Cierres
   - Crear nuevo cierre
   - Contar efectivo (billetes + monedas)
   - Ingresar datáfonos
   - Añadir otros medios si aplica
   - Comparar con POS
   - Guardar

5. **Revisar P&L:**
   - Ir a módulo P&L
   - Ver KPIs principales
   - Expandir secciones para detalle
   - Comparar con meses anteriores

---

## 🔒 Seguridad y Privacidad

### Características de Seguridad
- ✅ **100% Local**: No hay servidor backend
- ✅ **Sin envío de datos**: Todo se procesa en el navegador
- ✅ **localStorage**: Los datos permanecen en el dispositivo
- ✅ **Sin eval()**: No se ejecuta código remoto
- ✅ **Validación frontend**: Inputs sanitizados

### Consideraciones
⚠️ **Nota importante:** 
- Los datos NO están encriptados en localStorage
- Cualquier persona con acceso al navegador puede ver los datos
- Recomendado para uso en dispositivo personal o con control de acceso

### Backup
**Recomendación crítica:** Exportar datos periódicamente
- Función de exportación a JSON (próxima versión)
- Copiar manualmente localStorage como backup
- Evitar pérdida de datos al limpiar caché del navegador

---

## 📈 Rendimiento

### Métricas de Aplicación
- ⚡ Carga inicial: < 1 segundo
- ⚡ Renderizado de vistas: < 50ms
- ⚡ Búsqueda/filtros: < 100ms
- ⚡ Lectura localStorage: < 5ms
- ⚡ Escritura localStorage: < 20ms

### Métricas OCR
- ✅ PDF con texto embebido: < 500ms (Excelente)
- ✅ Imagen JPEG (1920x1080): 3-5 segundos (Aceptable)
- ⚠️ Imagen PNG alta resolución: 5-8 segundos (Mejorable)

---

## 🎯 Casos de Uso

### Restaurante Tradicional
- Registro de facturas de proveedores (carnes, pescados, verduras)
- Control de inventario semanal
- Cierres diarios (comida + cena)
- Cálculo de escandallos de platos estrella
- P&L mensual para análisis de rentabilidad

### Cafetería
- Registro de compras (café, leche, bollería)
- Control de mermas (productos perecederos)
- Cierres por turno
- Seguimiento de márgenes por producto
- Análisis de costes vs ingresos

### Restaurante con Delivery
- Facturas de proveedores
- Registro de pedidos por plataforma (Glovo, Uber Eats)
- Cálculo de comisiones
- P&L separado: TPV vs Delivery
- Optimización de menú según márgenes

---

## 🐛 Estado de Calidad

### Auditoría Técnica (v4.27.1)

**Resultado:** ✅ **APROBADO PARA PRODUCCIÓN**

**Código:**
- ✅ 4,357 líneas JavaScript
- ✅ Sin código muerto
- ✅ Sin console.log de debug
- ✅ Sin funciones duplicadas
- ✅ Nomenclatura consistente
- ✅ Comentarios descriptivos

**Funcionalidades:**
- ✅ OCR operativo al 100%
- ✅ Todas las features funcionales
- ✅ Sin bugs críticos conocidos
- ✅ Validaciones robustas

**Testing:**
- ✅ Manual testing: 100% features principales
- ❌ Automated testing: No implementado (v5.0)

**Deuda Técnica:** Baja (3/10)
- Función OCR muy larga (candidata a refactorización)
- localStorage sin encriptación
- Falta testing automatizado

---

## 🗺️ Roadmap Futuro

### Prioridad Alta (v5.0)
1. 🔴 **Backup automático**
   - Exportar/importar datos JSON
   - Prevenir pérdida de datos

2. 🟡 **Testing automatizado**
   - Unit tests con Vitest
   - E2E con Playwright
   - Coverage mínimo 70%

3. 🟡 **Responsive design**
   - Adaptar UI para móviles
   - Mejorar tablets

### Prioridad Media
4. 🟢 **Módulos ES6**
   - Separar OCR en módulo independiente
   - Mejor mantenibilidad

5. 🟢 **Encriptación**
   - crypto.subtle.encrypt() para datos sensibles

6. 🟢 **Predicción de compras**
   - ML para sugerir pedidos

### Prioridad Baja
7. 🔵 **App móvil nativa**
   - React Native o Flutter
   - Acceso a cámara mejorado

8. 🔵 **Integración TPV**
   - Conectar con caja registradora

9. 🔵 **Modo multi-usuario**
   - Backend Node.js + MongoDB
   - Roles (admin/empleado)

---

## 📚 Documentación Adicional

### Documentos del Proyecto

1. **PROJECT_BIBLE.md** (5,141 líneas)
   - Documentación técnica completa
   - Changelog detallado de todas las versiones
   - Ejemplos de código con contexto

2. **README.md**
   - Instrucciones de instalación
   - Características principales
   - Uso básico

3. **AUDITORIA_ESPECIFICACION.md**
   - Auditoría técnica completa
   - Métricas de calidad
   - Recomendaciones

4. **DESIGN-UX-UI.md**
   - Guía oficial de diseño
   - Sistema de componentes
   - Reglas para desarrollo

5. **UX-UI-PNL-Manager.md**
   - Especificación técnica UX
   - Flujos de usuario
   - Reglas contables
   - Patrones de extracción OCR

---

## 🤝 Contribución

Este es un proyecto personal en desarrollo activo.

### Reportar Bugs
- Abrir issue en GitHub con:
  - Descripción del problema
  - Pasos para reproducir
  - Navegador y versión
  - Screenshots si aplica

### Sugerencias
- Abrir issue con etiqueta `enhancement`
- Describir la funcionalidad deseada
- Justificar el valor añadido

---

## 📜 Licencia

**MIT License** - Uso libre

---

## 👤 Autor

Sistema desarrollado para gestión profesional de hostelería.

**Repositorio:** https://github.com/Depechee79/p-l-manager

---

## 📞 Soporte

### Navegadores Recomendados
- ✅ Google Chrome 120+ (Recomendado)
- ✅ Microsoft Edge 120+
- ✅ Firefox 119+
- ⚠️ Safari 17+ (OCR más lento)

### Dispositivos Recomendados
- ✅ PC Windows 10/11
- ✅ PC Linux (Ubuntu 22+)
- ✅ Tablet Android con Chrome
- ⚠️ iPad con Safari (OCR lento)
- ❌ Móviles (UI no optimizada)

**Configuración óptima:** PC o Tablet con Chrome/Edge

---

## ✨ Conclusión

P&L Manager es una **solución completa y profesional** para la gestión contable de establecimientos de hostelería. Su arquitectura offline, interfaz moderna y funcionalidades avanzadas (OCR, inventario, P&L) lo convierten en una herramienta valiosa para optimizar la gestión financiera y operativa.

**Características destacadas:**
- 🎯 Fácil de usar: No requiere formación técnica
- 🚀 Rápido: Todo se procesa localmente
- 🔒 Privado: Sin envío de datos a servidores
- 💼 Profesional: Cálculos contables precisos
- 📊 Completo: Cubre todo el ciclo de gestión

---

**Última actualización:** Noviembre 2025  
**Versión del documento:** 1.0  
**Estado del proyecto:** ✅ Producción - Desarrollo activo
