# REGLA: Mantener Contexto entre Tareas

---

## Cuando aplica
- Toda interaccion con agentes IA
- Tareas multi-paso
- Cambios que afectan multiples archivos

---

## Objetivo
Que el agente mantenga coherencia y no "olvide" decisiones previas.
Previene: contradicciones, cambios inconsistentes, trabajo perdido.

---

## PROBLEMA

Los agentes IA pueden:
- Olvidar decisiones tomadas en pasos anteriores
- Contradecir sus propias recomendaciones
- Perder el hilo de tareas complejas
- No conectar cambios relacionados

---

## TECNICAS PARA MANTENER CONTEXTO

### 1. Resumir al inicio de cada iteracion

El agente DEBE iniciar cada respuesta con:

```markdown
## Contexto actual
- Proyecto: [nombre]
- Objetivo: [objetivo de la sesion]
- Ultimo paso: [que se hizo]
- Estado: [completado/en progreso/bloqueado]
```

### 2. Referenciar decisiones previas

```markdown
## Decisiones tomadas en esta sesion

| # | Decision | Razon | Donde aplica |
|---|----------|-------|--------------|
| 1 | Usar Repository pattern | Centralizar acceso a datos | services/ |
| 2 | Componentes en PascalCase | Convencion del proyecto | components/ |
| 3 | Validacion con Zod | Ya existe en el proyecto | schemas/ |

Al proponer cambios, verificar coherencia con estas decisiones.
```

### 3. Conectar cambios relacionados

```markdown
## Cambios relacionados

Este cambio en `UserService.ts` afecta a:
- `useUser.ts` - Debe actualizar la llamada
- `UserProfile.tsx` - Puede necesitar ajuste de props
- `user.types.ts` - Verificar que types coinciden

Verificare coherencia en todos estos archivos.
```

### 4. Checkpoint antes de cambios grandes

```markdown
## Checkpoint pre-cambio

Antes de modificar la arquitectura de auth:

1. Estado actual documentado:
   - Login via email/password
   - Tokens en localStorage
   - Refresh manual

2. Cambios propuestos:
   - Anadir Google OAuth
   - Tokens en httpOnly cookies
   - Refresh automatico

3. Archivos que se modificaran:
   - lib/auth.ts
   - hooks/useAuth.ts
   - pages/login.tsx
   - middleware.ts (nuevo)

Confirma antes de proceder.
```

---

## FORMATO DE CIERRE DE TAREA

Al completar cada tarea, el agente DEBE documentar:

```markdown
## Resumen de cambios

### Archivos modificados
| Archivo | Cambio | Estado |
|---------|--------|--------|
| `src/services/userService.ts` | Agregado metodo `updateProfile` | OK |
| `src/hooks/useUser.ts` | Actualizado para usar nuevo metodo | OK |
| `src/types/user.ts` | Agregado tipo `UpdateProfileInput` | OK |

### Decisiones tomadas
1. Usar `Partial<User>` para updates parciales
2. Validar en servicio, no en hook
3. Mantener consistencia con patron existente

### Conexiones a recordar
- El nuevo metodo `updateProfile` se usara en `ProfileForm`
- El tipo `UpdateProfileInput` debe usarse en tests

### Siguiente paso sugerido
Implementar `ProfileForm` que use `useUser().updateProfile`

### Riesgos identificados
- Si se cambia `User`, actualizar tambien `UpdateProfileInput`
```

---

## REGLAS PARA EL AGENTE

### SIEMPRE:
- Leer el historial antes de proponer cambios
- Referenciar decisiones previas cuando sean relevantes
- Verificar coherencia con cambios anteriores
- Documentar el estado al cerrar tarea

### NUNCA:
- Contradecir decisiones sin explicar por que
- Asumir que el contexto se "recuerda" automaticamente
- Hacer cambios aislados sin considerar dependencias
- Cerrar tarea sin documentar estado

---

## CUANDO EL CONTEXTO SE PIERDE

Si el agente detecta perdida de contexto:

```markdown
## Alerta: Posible perdida de contexto

Detecto que la peticion actual puede contradecir:
- [Decision anterior X]
- [Cambio previo Y]

Opciones:
1. Continuar con la nueva direccion (explicar por que)
2. Mantener la decision original
3. Necesito mas contexto para decidir

Que prefieres?
```

---

## COMANDOS PARA RECUPERAR CONTEXTO

El usuario puede pedir:

| Comando | Efecto |
|---------|--------|
| `RESUMEN:` | Agente resume el estado actual |
| `DECISIONES:` | Lista decisiones tomadas |
| `PENDIENTE:` | Lista tareas pendientes |
| `CONTEXTO:` | Reconstruir contexto completo |

---

## Verificacion

- [ ] Agente resume contexto al inicio?
- [ ] Decisiones previas referenciadas?
- [ ] Cambios relacionados identificados?
- [ ] Cierre de tarea documentado?
- [ ] Sin contradicciones con pasos anteriores?

---

*El contexto es oro. No lo pierdas.*
