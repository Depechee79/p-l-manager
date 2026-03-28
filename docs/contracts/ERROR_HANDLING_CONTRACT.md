# Error Handling Contract — P&L Antigravity

> **Logger:** `src/core/services/LoggerService.ts` (singleton `logger`)
> **Toast:** `src/hooks/useToast.ts` (user-facing feedback)
> **Enforced by:** Supreme Rule Section "CODE Engineering" + Absolute Prohibitions

---

## 1. Error Taxonomy

| Error Type | Source | HTTP/Firestore Code | User Impact |
|-----------|--------|---------------------|-------------|
| `PermissionDenied` | Firestore rules, auth | `permission-denied` | Cannot perform action |
| `NotFound` | Missing document/resource | `not-found` | Record does not exist |
| `NetworkError` | Connectivity, timeout | `unavailable` | Cannot reach server |
| `ValidationError` | Form input, data format | `invalid-argument` | Bad input needs correction |
| `ServerError` | Cloud Functions, backend | `internal` | Server-side failure |
| `DocumentRecognitionError` | Claude Vision API | Various | OCR failed to process document |
| `QuotaExceeded` | Firestore limits | `resource-exhausted` | Rate limit hit |
| `Unknown` | Unclassified errors | — | Unexpected failure |

---

## 2. Mandatory Error Handling Pattern

Every `catch` block in the codebase **must** follow this pattern:

```typescript
try {
  await someAsyncOperation();
} catch (error: unknown) {
  logger.error('Description of what failed', { error, context: 'operation-name' });
  showToast({ type: 'error', message: 'User-friendly Spanish message' });
}
```

### 2.1 Rules

- **NEVER** `catch {}` (empty catch). This silently swallows errors.
- **NEVER** `catch (e) {}` (unused parameter). Log it.
- **NEVER** `catch (error: any)`. Always `catch (error: unknown)`.
- **ALWAYS** log with `logger.error()` before showing toast.
- **ALWAYS** provide a user-friendly message in Spanish.
- **ALWAYS** include context object for debugging.

### 2.2 Error Type Narrowing

```typescript
catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Error desconocido';
  const code = isFirestoreError(error) ? error.code : 'unknown';

  logger.error('Failed to save cierre', { error, code, cierreId });
  showToast({
    type: 'error',
    message: getSpanishErrorMessage(code),
  });
}
```

---

## 3. Firebase Error Code Mapping

Map Firestore error codes to user-friendly Spanish messages:

```typescript
function getFirestoreErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'permission-denied': 'No tienes permisos para realizar esta accion.',
    'not-found': 'El registro solicitado no existe o ha sido eliminado.',
    'unavailable': 'No se puede conectar con el servidor. Comprueba tu conexion.',
    'invalid-argument': 'Los datos introducidos no son validos. Revisa el formulario.',
    'resource-exhausted': 'Se ha superado el limite de operaciones. Espera un momento e intenta de nuevo.',
    'already-exists': 'Ya existe un registro con estos datos.',
    'failed-precondition': 'No se puede completar la operacion. Recarga la pagina e intenta de nuevo.',
    'unauthenticated': 'Tu sesion ha expirado. Inicia sesion de nuevo.',
    'deadline-exceeded': 'La operacion ha tardado demasiado. Intenta de nuevo.',
    'cancelled': 'La operacion fue cancelada.',
    'internal': 'Error interno del servidor. Si persiste, contacta con soporte.',
    'data-loss': 'Error critico de datos. Contacta con soporte inmediatamente.',
  };

  return messages[code] || 'Ha ocurrido un error inesperado. Intenta de nuevo.';
}
```

### 3.1 Firestore Error Type Guard

```typescript
interface FirestoreError {
  code: string;
  message: string;
}

function isFirestoreError(error: unknown): error is FirestoreError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as FirestoreError).code === 'string'
  );
}
```

---

## 4. Claude Vision API Errors (Document Recognition)

| Scenario | Detection | User Message |
|----------|-----------|-------------|
| Low confidence score | `confidence < 0.7` | "El documento no se ha podido leer con claridad. Intenta con una foto mas nitida." |
| Unreadable document | API returns no data | "No se ha podido reconocer el documento. Asegurate de que la imagen sea legible." |
| API timeout | Network timeout | "El servicio de reconocimiento no responde. Intenta de nuevo en unos segundos." |
| Invalid image format | Pre-validation | "Formato de imagen no soportado. Usa JPG, PNG o PDF." |
| Image too large | Pre-validation | "La imagen es demasiado grande. Reduce el tamano o recorta la zona relevante." |
| API rate limit | 429 response | "Demasiadas solicitudes. Espera un momento e intenta de nuevo." |
| API key invalid | 401/403 response | "Error de configuracion. Contacta con el administrador." |

```typescript
async function processDocument(imageData: Blob): Promise<DocumentResult> {
  try {
    const result = await callClaudeVisionAPI(imageData);

    if (result.confidence < 0.7) {
      logger.warn('Low confidence OCR result', { confidence: result.confidence });
      showToast({
        type: 'warning',
        message: 'El documento se ha leido con baja precision. Revisa los datos extraidos.',
      });
    }

    return result;
  } catch (error: unknown) {
    logger.error('Document recognition failed', { error });
    // Map to appropriate user message based on error type
    throw error;
  }
}
```

---

## 5. User-Facing Message Guidelines

### 5.1 Structure

Every error message must answer two questions:
1. **What happened?** (in plain Spanish)
2. **What should the user do?** (concrete action)

```
// CORRECT
"No se pudo guardar el cierre. Comprueba tu conexion e intenta de nuevo."

// WRONG
"Error: PERMISSION_DENIED at /cierres/abc123"
```

### 5.2 Tone

- **Clear:** No ambiguity about what went wrong.
- **Actionable:** Always suggest a next step.
- **Respectful:** Never blame the user.
- **No technical jargon:** Never show error codes, collection names, or stack traces.

### 5.3 Examples by Scenario

| Scenario | Message |
|----------|---------|
| Save failed (network) | "No se pudo guardar. Comprueba tu conexion e intenta de nuevo." |
| Save failed (permissions) | "No tienes permisos para realizar esta accion." |
| Delete failed | "No se pudo eliminar el registro. Intenta de nuevo." |
| Load failed | "Error al cargar los datos. Pulsa 'Reintentar' para volver a intentarlo." |
| Session expired | "Tu sesion ha expirado. Inicia sesion de nuevo." |
| Validation failed | "Algunos campos tienen errores. Revisa los datos marcados en rojo." |

---

## 6. LoggerService Usage

### 6.1 Log Levels

| Level | Method | When |
|-------|--------|------|
| `debug` | `logger.debug()` | Development-only traces (hidden in prod) |
| `info` | `logger.info()` | Significant events: user actions, state changes |
| `warn` | `logger.warn()` | Recoverable issues: low confidence OCR, retry succeeded |
| `error` | `logger.error()` | Failures: API errors, caught exceptions |

### 6.2 Structured Context

Always include a context object for debugging:

```typescript
logger.error('Failed to save cierre', {
  error,
  cierreId,
  restaurantId,
  userId: currentUser.uid,
  action: 'save',
});
```

### 6.3 Prohibition

- **NEVER** use `console.log()` in final code. Use `logger.debug()`.
- **NEVER** use `console.error()` directly. Use `logger.error()`.
- **NEVER** use `console.warn()` directly. Use `logger.warn()`.
- `console.*` is only acceptable in `LoggerService.ts` itself.

---

## 7. Toast Feedback

### 7.1 Toast Types

| Type | Color | Icon | Duration | Usage |
|------|-------|------|----------|-------|
| `success` | `--success` | Checkmark | 3s auto-dismiss | Operation completed |
| `error` | `--danger` | X circle | 5s (or manual dismiss) | Operation failed |
| `warning` | `--warning` | Triangle | 4s auto-dismiss | Partial success, needs attention |
| `info` | `--info` | Info circle | 3s auto-dismiss | Informational, no action needed |

### 7.2 Usage Pattern

```typescript
const { showToast } = useToast();

// Success
showToast({ type: 'success', message: 'Cierre guardado correctamente' });

// Error
showToast({ type: 'error', message: 'Error al guardar el cierre. Intenta de nuevo.' });

// Warning
showToast({ type: 'warning', message: 'Cierre guardado con varianza alta (32,50 EUR)' });
```

---

## 8. Form Validation

### 8.1 Inline Errors

- Show error message **below** the invalid field.
- Error text color: `--danger`.
- Field border color changes to `--danger` on error.
- Clear error when user starts editing the field.

```tsx
<Input
  label="Efectivo"
  value={efectivo}
  error={errors.efectivo} // "El importe debe ser mayor que 0"
  onChange={(val) => {
    setEfectivo(val);
    clearError('efectivo'); // Clear on change
  }}
/>
```

### 8.2 Scroll to First Error

When a form has multiple validation errors:
1. Validate all fields.
2. Set all error messages.
3. Scroll to the first field with an error.
4. Focus that field.

```typescript
function handleSubmit() {
  const validationErrors = validateForm(formData);

  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    const firstErrorField = Object.keys(validationErrors)[0];
    document.getElementById(firstErrorField)?.scrollIntoView({ behavior: 'smooth' });
    document.getElementById(firstErrorField)?.focus();
    return;
  }

  // Proceed with submit...
}
```

### 8.3 Required Field Validation

- Mark required fields with `*` in label.
- Validate on submit, not on blur (less disruptive for mobile users).
- Empty required field: "Este campo es obligatorio."

---

## 9. Error Boundary (React)

```tsx
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React Error Boundary caught error', {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
```

Place `<ErrorBoundary>` at:
- App root (catches everything).
- Each major page/feature (isolated failures).

---

## 10. Error Handling Anti-Patterns

| Anti-Pattern | Why It Is Wrong | Correct Pattern |
|-------------|-----------------|-----------------|
| `catch {}` | Silently swallows error | `catch (error: unknown) { logger.error(...) }` |
| `catch (e: any)` | Disables type system | `catch (error: unknown)` |
| `console.error(e)` | Bypasses logger | `logger.error(message, { error })` |
| `alert(e.message)` | Ugly UX, blocks thread | `showToast({ type: 'error', ... })` |
| `// TODO: handle error` | Error is unhandled | Handle it now or don't ship it |
| `.catch(() => null)` | Converts error to null | Handle the error state explicitly |
| `try { } catch { return []; }` | Hides failure as empty data | Show error state, allow retry |

---

## 11. Verification Checklist

Before any PR touching error handling:

- [ ] All `catch` blocks use `catch (error: unknown)` (not `any`, not empty)
- [ ] All caught errors are logged with `logger.error()` with context
- [ ] All user-facing errors show toast in Spanish
- [ ] Error messages explain what to do (actionable)
- [ ] No `console.log`, `console.error`, or `console.warn` outside LoggerService
- [ ] No `window.alert()` or `window.confirm()` anywhere
- [ ] Form validation shows inline errors below fields
- [ ] Form validation scrolls to first error
- [ ] Firebase error codes mapped to Spanish messages
- [ ] Error boundary exists at app root and feature level
- [ ] No silently swallowed errors (grep for empty catch blocks)
