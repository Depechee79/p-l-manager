# P&L Manager — Inventario de Componentes

> Catalogo de componentes exportados desde `src/shared/components/index.ts`.
> Ultima actualizacion: 2026-03-27 (Sesion #005)

## Nota sobre duplicacion V1/V2

Existen componentes duplicados que requieren consolidacion:
- **Button.tsx + ButtonV2.tsx** — Dos implementaciones de boton. Consolidar en uno solo.

Esta consolidacion esta en el backlog como tarea de prioridad alta.

## Core Components

| Componente | Archivo | Descripcion |
|------------|---------|-------------|
| `Checkbox` | `Checkbox.tsx` | Checkbox con label |
| `Button` | `Button.tsx` | Boton primario (V1) |
| `ButtonV2` | `ButtonV2.tsx` | Boton mejorado con soporte iconos (V2) |
| `Switch` | `Switch.tsx` | Toggle switch |
| `Card` | `Card.tsx` | Contenedor de contenido |
| `Input` | `Input.tsx` | Campo de texto |
| `Modal` | `Modal.tsx` | Dialogo overlay (V1) |
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

## V2 Design System Components

Componentes del sistema de diseno V2, basados en referencia Almacen (36px height, 8px radius, filtros compactos).

| Componente | Archivo | Descripcion |
|------------|---------|-------------|
| `TabsNavV2` | `TabsNavV2.tsx` | Navegacion tabs V2 |
| `ButtonV2` | `ButtonV2.tsx` | Boton V2 con iconos izquierda/derecha |
| `ActionHeaderV2` | `ActionHeaderV2.tsx` | Cabecera de acciones V2 |
| `FilterCardV2` | `FilterCardV2.tsx` | Tarjeta de filtros V2 |
| `FilterInputV2` | `FilterCardV2.tsx` | Input de filtro V2 |
| `FilterTextInput` | `FilterCardV2.tsx` | Input de texto para filtro |
| `FilterSelect` | `FilterCardV2.tsx` | Select para filtro |
| `DataCardV2` | `DataCardV2.tsx` | Tarjeta de datos/KPIs V2 |
| `PageLayoutV2` | `PageLayoutV2.tsx` | Layout de pagina V2 |
| `SelectV2` | `SelectV2.tsx` | Select mejorado V2 |

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

- **Core:** 8 componentes
- **Form:** 6 componentes
- **Feedback:** 12 componentes (incluyendo 8 variantes Skeleton)
- **Layout:** 5 componentes
- **Navigation:** 1 componente
- **V2 Design System:** 10 componentes
- **Security:** 1 componente
- **Layout Shell:** 11 componentes
- **TOTAL:** ~54 componentes shared
