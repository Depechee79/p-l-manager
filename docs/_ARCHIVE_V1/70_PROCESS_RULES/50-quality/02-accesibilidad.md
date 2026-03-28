# REGLA: Accesibilidad (A11y)

---

## Cuando aplica
- Todo desarrollo de UI
- Formularios
- Navegacion
- Contenido multimedia

---

## Objetivo
Hacer la aplicacion usable por todos, incluyendo personas con discapacidades.
Previene: exclusion de usuarios, problemas legales, mala UX.

---

## NIVELES WCAG

| Nivel | Objetivo | Obligatoriedad |
|-------|----------|----------------|
| A | Minimo | Obligatorio |
| AA | Estandar | **OBJETIVO** |
| AAA | Optimo | Ideal |

**Objetivo minimo: WCAG 2.2 AA**

---

## PRINCIPIOS FUNDAMENTALES

### 1. Perceptible
El contenido debe ser presentable de formas que los usuarios puedan percibir.

### 2. Operable
Los componentes de UI deben ser operables.

### 3. Comprensible
La informacion y operacion de UI debe ser comprensible.

### 4. Robusto
El contenido debe ser suficientemente robusto para ser interpretado por tecnologias asistivas.

---

## REGLAS PRACTICAS

### HTML Semantico

```tsx
// MAL: Divs para todo
<div onClick={handleClick}>Guardar</div>
<div class="header">Titulo</div>
<div class="nav">...</div>

// BIEN: HTML semantico
<button onClick={handleClick}>Guardar</button>
<h1>Titulo</h1>
<nav>...</nav>
```

**Elementos semanticos a usar:**
- `<header>`, `<main>`, `<footer>`, `<nav>`, `<aside>`
- `<h1>` - `<h6>` (en orden, sin saltar niveles)
- `<button>` para acciones, `<a>` para navegacion
- `<ul>`, `<ol>`, `<li>` para listas
- `<table>`, `<th>`, `<td>` para datos tabulares
- `<form>`, `<fieldset>`, `<legend>`

### Navegacion por Teclado

```tsx
// Todos los elementos interactivos deben ser focusables
// Orden de tab logico

// Manejo de foco en modales
function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus al abrir
      modalRef.current?.focus();
    }
  }, [isOpen]);

  // Cerrar con Escape
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
}
```

**Teclas a soportar:**
- `Tab` / `Shift+Tab`: Navegar entre elementos
- `Enter` / `Space`: Activar botones
- `Escape`: Cerrar modales/menus
- `Arrow keys`: Navegar dentro de componentes

### Foco Visible

```css
/* MAL: Quitar outline */
*:focus {
  outline: none;
}

/* BIEN: Estilo de foco visible */
*:focus-visible {
  outline: 2px solid #4A90D9;
  outline-offset: 2px;
}

/* Para navegacion por teclado */
button:focus-visible {
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.5);
}
```

### Contraste de Colores

| Tipo | Ratio minimo AA | Ratio minimo AAA |
|------|-----------------|------------------|
| Texto normal | 4.5:1 | 7:1 |
| Texto grande (18px+) | 3:1 | 4.5:1 |
| Elementos UI | 3:1 | 3:1 |

```tsx
// Verificar contraste con herramientas
// - Chrome DevTools: Inspect > Accessibility
// - https://webaim.org/resources/contrastchecker/

// Ejemplo de colores con buen contraste
const colors = {
  text: '#1A1A1A',        // Sobre blanco: 16.1:1
  textMuted: '#666666',   // Sobre blanco: 5.74:1
  background: '#FFFFFF',
  primary: '#0066CC',     // Sobre blanco: 4.5:1
};
```

### Labels y Alt Text

```tsx
// Inputs SIEMPRE con label
// MAL
<input type="text" placeholder="Email" />

// BIEN
<label htmlFor="email">Email</label>
<input id="email" type="text" />

// O label implicito
<label>
  Email
  <input type="text" />
</label>

// Imagenes SIEMPRE con alt
// MAL
<img src="product.jpg" />

// BIEN: Informativo
<img src="product.jpg" alt="Camiseta azul talla M" />

// BIEN: Decorativo (alt vacio)
<img src="decorative-line.svg" alt="" role="presentation" />

// Iconos interactivos
<button aria-label="Cerrar modal">
  <CloseIcon aria-hidden="true" />
</button>
```

### ARIA cuando es necesario

```tsx
// Roles para componentes custom
<div role="tablist">
  <button role="tab" aria-selected="true">Tab 1</button>
  <button role="tab" aria-selected="false">Tab 2</button>
</div>

// Estados
<button aria-pressed="true">Toggle</button>
<button aria-expanded="false" aria-controls="menu">Menu</button>
<div id="menu" aria-hidden="true">...</div>

// Live regions para actualizaciones
<div aria-live="polite" aria-atomic="true">
  {notification}
</div>

// Errores de formulario
<input
  id="email"
  aria-invalid={hasError}
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">
  {errorMessage}
</span>
```

### Formularios Accesibles

```tsx
function AccessibleForm() {
  const [errors, setErrors] = useState({});

  return (
    <form aria-label="Formulario de contacto">
      <fieldset>
        <legend>Informacion de contacto</legend>

        <div>
          <label htmlFor="name">Nombre *</label>
          <input
            id="name"
            type="text"
            required
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <span id="name-error" role="alert" className="error">
              {errors.name}
            </span>
          )}
        </div>

        <button type="submit">Enviar</button>
      </fieldset>
    </form>
  );
}
```

---

## CHECKLIST WCAG 2.2 AA

### Perceptible
- [ ] Imagenes tienen alt text
- [ ] Videos tienen subtitulos
- [ ] Contraste de texto >= 4.5:1
- [ ] Contenido no depende solo del color

### Operable
- [ ] Todo funciona con teclado
- [ ] Foco visible en todos los elementos
- [ ] Sin contenido que parpadea
- [ ] Skip links para navegacion

### Comprensible
- [ ] Idioma declarado en HTML
- [ ] Labels en todos los inputs
- [ ] Errores descritos claramente
- [ ] Navegacion consistente

### Robusto
- [ ] HTML valido
- [ ] Nombres y roles en componentes custom
- [ ] Compatible con lectores de pantalla

---

## HERRAMIENTAS DE TESTING

```bash
# Lighthouse
npx lighthouse https://example.com --view

# axe-core (en tests)
npm install @axe-core/react

# Testing Library
npm install @testing-library/jest-dom
```

```tsx
// Test de accesibilidad
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should not have accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Verificacion

- [ ] HTML semantico usado?
- [ ] Navegacion por teclado funciona?
- [ ] Foco siempre visible?
- [ ] Contraste >= 4.5:1?
- [ ] Todos los inputs tienen label?
- [ ] Imagenes tienen alt?
- [ ] Errores anunciados correctamente?
- [ ] Sin violaciones en Lighthouse/axe?

---

*Accesibilidad es responsabilidad de todos.*
