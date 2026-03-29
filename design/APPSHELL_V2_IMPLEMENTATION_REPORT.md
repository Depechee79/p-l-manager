# AppShell V2 - Reporte de Implementación

> **Fecha**: 2026-01-19
> **Sesión**: Implementación AppShellV2 basado en Canon Stitch

---

## Resumen Ejecutivo

Se ha implementado un nuevo sistema de layout (AppShellV2) basado en el diseño de Stitch con las siguientes características:

- **Topbar fijo** de 64px full width con brand, breadcrumb dinámico y user block
- **Sidebar fijo** de 256px posicionado debajo del topbar
- **Rollout controlado**: Solo activo en `/almacen` y `/docs`
- **El resto de la app** mantiene el layout original sin cambios

---

## Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `src/shared/components/layout/TopbarV2.tsx` | Header fijo con brand, breadcrumb, notificaciones y user block |
| `src/shared/components/layout/SidebarNavV2.tsx` | Sidebar fijo debajo del topbar |
| `src/shared/components/layout/AppShellV2.tsx` | Wrapper que orquesta topbar + sidebar + main |
| `src/shared/config/routeMeta.ts` | Configuración de breadcrumbs, títulos y subtítulos por ruta |
| `design/APPSHELL_V2_SPEC.md` | Especificaciones extraídas del HTML canon |

---

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `src/index.css` | Añadidos tokens de layout V2 (líneas 83-116) |
| `src/App.tsx` | Añadido `ConditionalLayout` para rollout controlado |
| `src/shared/components/layout/index.ts` | Exports de nuevos componentes |
| `src/shared/config/index.ts` | Export de routeMeta |

---

## Tokens CSS Añadidos

```css
/* APP SHELL V2 TOKENS */
--app-topbar-h: 64px;
--app-topbar-px: 24px;
--app-topbar-z: 50;
--app-sidebar-w: 256px;
--app-sidebar-py: 24px;
--app-sidebar-px: 16px;
--app-sidebar-z: 40;
--app-content-pad: 24px;
--app-content-pad-lg: 32px;
--app-interactive-h: 36px;
--app-interactive-radius: 8px;
--app-interactive-font-size: 12px;
--app-filter-input-h: 32px;
--app-filter-label-size: 8px;
--app-filter-input-size: 11px;
--app-section-label-size: 11px;
--app-breadcrumb-size: 12px;
--app-subtitle-size: 11px;
```

---

## Rutas con AppShellV2 (Rollout Controlado)

```typescript
const V2_ROUTES = ['/almacen', '/docs'];
```

Para expandir a más rutas, simplemente añadir a este array en `App.tsx:15`.

---

## Arquitectura de Decisiones

### Mantenido del sistema actual:
- ✅ Colores (`--accent: #e11d48`)
- ✅ Tipografía (`Public Sans`)
- ✅ Iconos (`lucide-react`)
- ✅ Layout original para rutas fuera de V2_ROUTES

### Adoptado del canon Stitch:
- ✅ Topbar fijo 64px full width
- ✅ Sidebar fijo 256px debajo del topbar
- ✅ Interactive elements 36px altura
- ✅ Padding main: 24px / 32px (lg)
- ✅ Border radius 8px para elementos interactivos

---

## Cómo Validar

1. Iniciar el servidor: `npm run dev`
2. Autenticarse con un usuario válido
3. Navegar a `/almacen` o `/docs`
4. Verificar:
   - Topbar fijo de 64px con brand a la izquierda
   - Breadcrumb "Management > Almacén" visible (desktop)
   - User block a la derecha del topbar
   - Sidebar de 256px debajo del topbar
   - Contenido principal con margin-left correcto

---

## Checklist DoD

- [x] HTML canon usado como fuente de medidas/estructura
- [x] No hay hardcode fuera de tokens (valores en CSS variables)
- [x] Componentes reusables en `shared/components/layout`
- [x] Navegación centralizada en `navConfig.ts`
- [x] Rollout controlado solo en `/almacen` y `/docs`
- [x] Build/TypeScript OK (`npm run build` sin errores)
- [x] Colores carmín y tipografías mantenidas
- [ ] Validación visual pendiente (requiere autenticación)

---

## Pendiente para Próximas Iteraciones

1. **Validar visualmente** con usuario autenticado
2. **Ajustar estilos finos** si hay diferencias con el AFTER PNG
3. **Expandir rollout** a más rutas según se valide
4. **Mobile responsive** - El sidebar ya se oculta, pero verificar topbar en móvil
5. **PageHeaderV2** - Componente para toolbar con tabs (actualmente usa StickyPageHeader existente)

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build (verificar antes de commit)
npm run build

# Ver cambios
git status
git diff src/index.css
```

---

*Documento generado automáticamente - Sesión AppShellV2*
