# P&L Manager — Inventario de Componentes

> Catalogo de componentes exportados desde `src/shared/components/index.ts`.
> Ultima actualizacion: 2026-03-29 (Sesion #008)

## Core Components

| Componente | Archivo | Descripcion |
|------------|---------|-------------|
| `Checkbox` | `Checkbox.tsx` | Checkbox con label |
| `Button` | `Button.tsx` | Boton consolidado (todas las variantes, iconos, loading) |
| `Switch` | `Switch.tsx` | Toggle switch |
| `Card` | `Card.tsx` | Contenedor de contenido |
| `Input` | `Input.tsx` | Campo de texto |
| `Modal` | `Modal.tsx` | Dialogo overlay |
| `ConfirmDialog` | `ConfirmDialog.tsx` | Dialogo de confirmacion para acciones destructivas |
| `Table` | `Table.tsx` | Tabla de datos |

## Form Components

| Componente | Archivo | Descripcion |
|------------|---------|-------------|
| `FormField` | `FormField.tsx` | Wrapper de campo con label/error |
| `Select` | `Select.tsx` | Dropdown select |
| `DatePicker` | `DatePicker.tsx` | Selector de fecha |
| `TimePicker` | `TimePicker.tsx` | Selector de hora |
| `FormSection` | `FormSection.tsx` | Agrupacion de campos relacionados |
| `SelectWithAdd` | `SelectWithAdd.tsx` | Select con opcion de anadir nuevo |

## Feedback Components

| Componente | Archivo | Descripcion |
|------------|---------|-------------|
| `LoadingState` | `LoadingState.tsx` | Estado de carga |
| `Skeleton` | `LoadingSkeleton.tsx` | Skeleton base |
| `SkeletonText` | `LoadingSkeleton.tsx` | Skeleton para texto |
| `SkeletonCircle` | `LoadingSkeleton.tsx` | Skeleton circular |
| `SkeletonCard` | `LoadingSkeleton.tsx` | Skeleton para tarjetas |
| `SkeletonTableRow` | `LoadingSkeleton.tsx` | Skeleton para fila de tabla |
| `SkeletonTable` | `LoadingSkeleton.tsx` | Skeleton para tabla completa |
| `SkeletonListItem` | `LoadingSkeleton.tsx` | Skeleton para item de lista |
| `SkeletonList` | `LoadingSkeleton.tsx` | Skeleton para lista completa |
| `SkeletonKPI` | `LoadingSkeleton.tsx` | Skeleton para KPI individual |
| `SkeletonKPIGrid` | `LoadingSkeleton.tsx` | Skeleton para grid de KPIs |
| `Badge` | `Badge.tsx` | Indicador de estado/categoria |

## Layout Components

| Componente | Archivo | Descripcion |
|------------|---------|-------------|
| `StepIndicator` | `StepIndicator.tsx` | Indicador de pasos (wizard) |
| `NumericKeypad` | `NumericKeypad.tsx` | Teclado numerico (mobile) |
| `PageHeader` | `layout/PageHeader.tsx` | Cabecera de pagina |
| `PageContainer` | `layout/PageContainer.tsx` | Contenedor de pagina |
| `FilterBar` | `layout/FilterBar.tsx` | Barra de filtros |

## Navigation Components

| Componente | Archivo | Descripcion |
|------------|---------|-------------|
| `TabsHorizontal` | `TabsHorizontal.tsx` | Navegacion por tabs |

## Design System Components

Componentes del sistema de diseno (renombrados en Sesion #007 — el sufijo V2 fue eliminado).

| Componente | Archivo | Descripcion |
|------------|---------|-------------|
| `TabsNav` | `TabsNav.tsx` | Navegacion tabs |
| `ActionHeader` | `ActionHeader.tsx` | Cabecera de acciones |
| `FilterCard` | `FilterCard.tsx` | Tarjeta de filtros |
| `FilterInput` | `FilterCard.tsx` | Input de filtro |
| `FilterTextInput` | `FilterCard.tsx` | Input de texto para filtro |
| `FilterSelect` | `FilterCard.tsx` | Select para filtro |
| `DataCard` | `DataCard.tsx` | Tarjeta de datos/KPIs |
| `PageLayout` | `PageLayout.tsx` | Layout de pagina |
| `Select` | `Select.tsx` | Select mejorado |

## Security Components

| Componente | Archivo | Descripcion |
|------------|---------|-------------|
| `ProtectedRoute` | `ProtectedRoute.tsx` | Ruta protegida por autenticacion/permisos |

## Layout Shell Components (src/shared/components/layout/)

| Componente | Archivo | Descripcion |
|------------|---------|-------------|
| `AppShellV2` | `layout/AppShellV2.tsx` | Shell principal de la aplicacion |
| `TopbarV2` | `layout/TopbarV2.tsx` | Barra superior V2 |
| `SidebarNavV2` | `layout/SidebarNavV2.tsx` | Navegacion lateral V2 |
| `MobileBottomNav` | `layout/MobileBottomNav.tsx` | Navegacion inferior movil |
| `MobileSidebar` | `layout/MobileSidebar.tsx` | Sidebar movil (hamburger) |
| `MobileTopBar` | `layout/MobileTopBar.tsx` | Barra superior movil |
| `StickyPageHeader` | `layout/StickyPageHeader.tsx` | Cabecera de pagina sticky |
| `BrandHeader` | `layout/BrandHeader.tsx` | Cabecera con marca |
| `Sidebar` | `layout/Sidebar.tsx` | Sidebar legacy |
| `NavLink` | `layout/NavLink.tsx` | Link de navegacion |
| `UserSection` | `layout/UserSection.tsx` | Seccion de usuario |

## Totales

- **Core:** 8 componentes (Button consolidado, +ConfirmDialog)
- **Form:** 6 componentes
- **Feedback:** 12 componentes (incluyendo 8 variantes Skeleton)
- **Layout:** 5 componentes
- **Navigation:** 1 componente
- **Design System:** 9 componentes (renombrados sin sufijo V2, ButtonV2 consolidado en Button)
- **Security:** 1 componente
- **Layout Shell:** 11 componentes
- **TOTAL:** ~53 componentes shared
