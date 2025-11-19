# P&L Manager - Sistema de Gestión Hostelería

Sistema completo de gestión de pérdidas y ganancias para restaurantes y cafeterías con diseño moderno y profesional.

## 🎯 Características

- **OCR Profesional**: Extracción automática de datos desde facturas (PDF e imágenes)
- **Gestión de Cierres**: Sistema compacto con tabla desplegable por método de pago
- **Escandallos**: Cálculo de costes de platos con ingredientes y márgenes
- **P&L Completo**: Cuenta de explotación profesional con KPIs
- **Diseño Moderno**: Sistema UX/UI con paleta corporativa y tipografía Inter
- **100% Offline**: Funciona sin conexión, datos en localStorage

## 🚀 Tecnologías

- HTML5 + Vanilla JavaScript ES6
- Tesseract.js (OCR)
- PDF.js (lectura de PDFs)
- localStorage (persistencia)
- CSS moderno con sistema de diseño cohesivo
- Tipografía Google Fonts (Inter)

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/TU_USUARIO/pnl-manager.git
cd pnl-manager
```

2. Abre `app/index.html` en tu navegador
   - O usa un servidor local: `python -m http.server 8000`

## 📂 Estructura

```
P&L/
├── app/
│   ├── index.html      # Interfaz principal
│   ├── app.js          # Lógica completa (2545 líneas)
│   └── styles.css      # Estilos (1400+ líneas)
├── PROJECT_BIBLE.md    # Documentación técnica completa
├── modernize_ui.dm     # Plan de diseño UX
└── README.md
```

## 🎨 Módulos

### 📸 OCR - Registro Manual
- Tipos: Factura Proveedor, Albarán, Cierre de Caja, Delivery
- Soporte: JPG, PNG, WEBP, BMP, TIFF, PDF
- Preprocesado de imagen + Tesseract.js
- Confianza de extracción (alta/media/baja)

### 💰 Cierres
- Conteo de efectivo (billetes y monedas)
- Datafonos múltiples
- Otros medios de pago
- Comparación POS vs Real
- Detección automática de descuadres

### 📦 Compras (Facturas & Albaranes)
- Registro manual o vía OCR
- Búsqueda por proveedor y fechas
- Verificación contra facturas

### 📝 Proveedores
- Gestión completa de proveedores
- Tipos: Compra, Gasto, Ambos
- Condiciones de pago y frecuencia

### 🍽️ Productos & Escandallos
- Catálogo de productos
- Cálculo de coste por unidad
- Ingredientes con cantidades
- Food Cost % automático

### 📊 Inventario
- Control de stock
- Valoración a coste unitario

### 🚚 Delivery
- Registro de pedidos
- Plataformas múltiples
- Comisiones y costes

### 📈 P&L (Pérdidas y Ganancias)
- Cuenta de explotación completa
- KPIs principales
- Alertas automáticas
- Comparación temporal

## ⚙️ Configuración

El sistema no requiere configuración adicional. Los datos se guardan automáticamente en localStorage del navegador.

### Mes Actual
Se puede cambiar desde el selector en el sidebar.

## 📝 Uso

1. **Seleccionar Mes**: Usa el selector del sidebar
2. **Navegar por Módulos**: Click en los botones del menú lateral
3. **Registrar Datos**: 
   - Manualmente: Formularios tradicionales
   - OCR: Sube imagen/PDF y revisa datos extraídos
4. **Revisar P&L**: Todos los cálculos se actualizan automáticamente

## 🔒 Privacidad

- **100% Local**: No hay servidor backend
- **Sin envío de datos**: Todo se procesa en el navegador
- **localStorage**: Los datos permanecen en tu dispositivo

## 📜 Versión

**v4.23** - Sistema de Diseño UX/UI Moderno (Noviembre 2025)

### Últimas Mejoras
- ✅ Sistema de diseño moderno con paleta corporativa (#1171ef, #34c759, #ff3b30)
- ✅ Tipografía Inter integrada con pesos 400-700
- ✅ Cards con hover effects y elevación suave
- ✅ Inputs con focus rings y transiciones 0.2s
- ✅ Componentes consistentes en todos los módulos
- ✅ Sidebar oscuro profesional (#1d3041)
- ✅ Toast notifications con 4 variantes (success, error, info, warning)
- ✅ Modales con backdrop blur y border-radius 16px
- ✅ Sistema de cierres compacto con tabla desplegable
- ✅ OCR con soporte PDF (hasta 10MB)
- ✅ Preprocesado de imagen (contraste, escala de grises)
- ✅ Tesseract.js con configuración optimizada
- ✅ Resumen en tiempo real en formularios

## 🤝 Contribuir

Este es un proyecto personal. Si encuentras bugs o tienes sugerencias, abre un issue.

## 📄 Licencia

MIT License - Uso libre

## 👤 Autor

Sistema desarrollado para gestión profesional de hostelería.

---

**Nota**: Este sistema está diseñado para ser utilizado en navegadores modernos (Chrome, Firefox, Edge). No requiere instalación de dependencias externas.
