# 🎯 Tarea ARCH-04: Refactorizar Layout.tsx

**ID**: ARCH-04  
**Categoría**: Arquitectura  
**Prioridad**: 🟡 ALTA  
**Estado**: ⏳ En Progreso  
**Fecha inicio**: 2025-12-30  
**Dependencias**: ARCH-02 ✅

---

## 📋 Análisis del Archivo Actual

**Archivo**: `src/components/Layout.tsx`  
**Líneas**: 656  
**Tamaño**: 22.6KB

### Secciones Identificadas

| Sección | Líneas | Tamaño | Descripción |
|---------|--------|--------|-------------|
| Imports + Props | 1-32 | ~30 | Imports y LayoutProps |
| Hook/State | 33-74 | ~40 | Estados, contexto, navItems |
| Desktop Sidebar | 78-339 | ~260 | Sidebar completo para desktop |
| Mobile Header | 341-392 | ~50 | Top bar para mobile |
| Mobile Overlay | 394-542 | ~150 | Sidebar overlay para mobile |
| Main Content | 544-593 | ~50 | Área principal + footer |
| Mobile Bottom Nav | 595-652 | ~60 | Bottom navigation bar |

---

## 📐 Plan de División

### Componentes a Crear

```
src/shared/components/layout/
├── Sidebar.tsx              # Desktop sidebar (260 líneas → componente)
├── MobileTopBar.tsx         # Mobile header (50 líneas)
├── MobileSidebar.tsx        # Mobile overlay menu (150 líneas)
├── MobileBottomNav.tsx      # Bottom tab bar (60 líneas)
├── MainContent.tsx          # Wrapper del contenido principal
├── LayoutFooter.tsx         # Footer con versión
├── NavItem.tsx              # Item de navegación reutilizable
├── UserSection.tsx          # Sección de usuario con avatar y logout
├── RestaurantSelector.tsx   # Selector de restaurante
└── index.ts                 # Barrel exports
```

### Layout.tsx Resultante

```typescript
// Layout.tsx simplificado (~80 líneas)
import { Sidebar, MobileSidebar, MobileTopBar, MobileBottomNav, MainContent } from './layout';

export const Layout = ({ children, user, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  
  return (
    <div className="layout-container">
      {!isMobile && <Sidebar user={user} onLogout={onLogout} />}
      {isMobile && <MobileTopBar onMenuClick={() => setIsMobileMenuOpen(true)} />}
      {isMobile && isMobileMenuOpen && (
        <MobileSidebar 
          user={user} 
          onLogout={onLogout} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />
      )}
      <MainContent isMobile={isMobile}>{children}</MainContent>
      {isMobile && <MobileBottomNav />}
    </div>
  );
};
```

---

## ✅ Checklist de Ejecución

### Fase 1: Crear estructura base
- [ ] Crear carpeta `src/shared/components/layout/`
- [ ] Crear archivo `index.ts` con exports

### Fase 2: Extraer componentes pequeños primero
- [ ] Crear `NavItem.tsx` (item de navegación reutilizable)
- [ ] Crear `UserSection.tsx` (avatar + logout)
- [ ] Crear `RestaurantSelector.tsx` (dropdown restaurante)

### Fase 3: Extraer componentes principales
- [ ] Crear `Sidebar.tsx` (usando NavItem, UserSection, RestaurantSelector)
- [ ] Crear `MobileTopBar.tsx`
- [ ] Crear `MobileBottomNav.tsx`
- [ ] Crear `MobileSidebar.tsx`
- [ ] Crear `MainContent.tsx` (wrapper + footer)

### Fase 4: Refactorizar Layout.tsx original
- [ ] Simplificar Layout.tsx para usar los nuevos componentes
- [ ] Actualizar imports en el proyecto

### Fase 5: Verificación
- [ ] Build pasa
- [ ] App funciona en desktop
- [ ] App funciona en mobile
- [ ] Tests pasan

---

## ⚠️ Riesgos y Mitigación

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Props drilling excesivo | Media | Usar context si es necesario |
| Romper responsividad | Media | Verificar en ambos viewports |
| Estilos inline rotos | Baja | Mantener estilos exactos |

---

## 📝 Notas

- Mantener TODOS los estilos inline exactamente igual
- El contexto de restaurante ya existe, solo se pasa a componentes
- La lista `navItems` se puede mover a un archivo de config
