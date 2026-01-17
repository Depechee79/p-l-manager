# P&L Manager - Sistema de Gestión Hostelería

Sistema completo de gestión de pérdidas y ganancias para restaurantes y cafeterías con diseño moderno y profesional.

## 🎯 Características

- **OCR Profesional**: Extracción automática de datos desde facturas (PDF e imágenes)
- **Gestión de Cierres**: Sistema compacto con tabla desplegable por método de pago
- **Escandallos**: Cálculo de costes de platos con ingredientes y márgenes
- **P&L Completo**: Cuenta de explotación profesional con KPIs
- **Diseño Moderno**: Sistema UX/UI con paleta corporativa y tipografía Inter
- **🔥 Firebase Sync**: Sincronización automática con Firestore
- **📱 Offline First**: Funciona sin conexión, sincroniza cuando hay internet

## 🚀 Tecnologías

- **Frontend**: React 19 + TypeScript 5.9
- **Build**: Vite 7.2 
- **Testing**: Vitest 4.0 + React Testing Library (319 tests ✅)
- **Database**: Firebase Firestore (cloud sync)
- **Routing**: React Router DOM 7
- **State**: Context API + Custom Hooks
- **OCR**: Tesseract.js + PDF.js
- **Storage**: localStorage + Firestore

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/Depechee79/p-l-manager.git
cd p-l-manager
```

2. Instala dependencias:
```bash
npm install
```

3. Configura Firebase (opcional, para sincronización en la nube):
```bash
cp .env.example .env
# Edita .env con tus credenciales de Firebase
```
   Ver [FIREBASE_SETUP.md](FIREBASE_SETUP.md) para instrucciones detalladas

4. Ejecuta el proyecto:
```bash
npm run dev          # Desarrollo
npm run build        # Producción
npm test             # Tests (319 tests)
```

## 📂 Estructura

```
P&L/
├── src/
│   ├── components/      # Componentes React (66 tests)
│   ├── pages/           # Páginas principales (61 tests)
│   ├── hooks/           # Custom hooks (50 tests)
│   ├── services/        # Servicios de negocio (88 tests)
│   ├── context/         # Estado global (9 tests)
│   ├── utils/           # Utilidades (37 tests)
│   ├── types/           # Tipos TypeScript
│   ├── config/          # Configuración Firebase
│   └── App.tsx          # Aplicación principal (8 tests)
├── .env.example         # Plantilla variables entorno
├── FIREBASE_SETUP.md    # Guía configuración Firebase
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
- **Nuevo:** Filtro por meses y barras de totales en tiempo real

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
- Product Cost % automático

### 📊 Inventario
- Control de stock
- Valoración a coste unitario

### 🚚 Delivery
- Registro de pedidos
- Plataformas múltiples
- Comisiones y costes

### 📈 P&L (Pérdidas y Ganancias)
- Cuenta de explotación completa y detallada (OPEX desglosado)
- KPIs principales compactos (Product Cost, EBITDA, etc.)
- Alertas automáticas
- Comparación temporal con selector de mes

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
