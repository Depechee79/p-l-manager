# REGLA: Decisiones Atomicas

---

## Cuando aplica
- Toda interaccion con agentes IA
- Peticiones del usuario
- Cambios de codigo

---

## Objetivo
Un objetivo por iteracion, una decision a la vez.
Previene: cambios descontrolados, scope creep, confusion.

---

## PRINCIPIO FUNDAMENTAL

```
1 PETICION = 1 OBJETIVO = 1 CONJUNTO DE CAMBIOS COHERENTES
```

---

## DETECCION DE MULTIPLES OBJETIVOS

### Peticion con multiples objetivos

```markdown
Usuario: "Arregla el bug del login, refactoriza el menu y anade dark mode"

## Analisis de peticion

Objetivos detectados: 3
1. Arreglar bug del login
2. Refactorizar el menu
3. Anadir dark mode

REGLA VIOLADA: 1 objetivo por iteracion

## Respuesta

He detectado 3 objetivos diferentes en tu peticion:
1. Bug del login
2. Refactor del menu
3. Dark mode

Cual quieres que aborde primero?
Solo puedo trabajar en 1 objetivo a la vez para evitar errores.
```

### Peticion ambigua

```markdown
Usuario: "Mejora el formulario"

## Analisis de peticion

Objetivo: Ambiguo - "mejora" puede significar muchas cosas

Posibles interpretaciones:
1. Mejorar UX (validacion, feedback)
2. Mejorar performance
3. Mejorar accesibilidad
4. Mejorar estilos
5. Corregir bugs

## Respuesta

"Mejora el formulario" puede significar varias cosas.
Cual de estas es tu prioridad?

1. UX: mejor validacion y mensajes de error
2. Performance: optimizar renders
3. Accesibilidad: labels, foco, ARIA
4. Visual: estilos y layout
5. Otro: [especificar]
```

---

## CAMBIOS ATOMICOS

### Definicion

Un cambio atomico es:
- **Completo**: Funciona por si solo, no deja codigo roto
- **Minimo**: Solo lo necesario para el objetivo
- **Coherente**: Todos los archivos relacionados actualizados
- **Reversible**: Facil de deshacer si hay problemas

### Ejemplo

```markdown
## Cambio atomico: Agregar validacion de email

### Archivos a modificar
1. `schemas/userSchema.ts` - Agregar validacion
2. `components/UserForm.tsx` - Mostrar error
3. `hooks/useUserForm.ts` - Integrar schema

### NO incluir (fuera de scope)
- Refactor de otros campos
- Cambios de estilos
- Mejoras de UX no relacionadas
```

### Anti-patron: Cambio "aprovechando"

```markdown
## MAL: Aprovechando para...

"Ya que estoy en el archivo, aprovecho para:
- Arreglar el import
- Cambiar el nombre de la variable
- Refactorizar esta funcion"

## BIEN: Solo el objetivo

"Solo modifico lo necesario para agregar validacion de email.
Los otros cambios los anoto como tareas separadas."

### Tareas detectadas para despues:
- [ ] Fix: import incorrecto en userSchema.ts
- [ ] Refactor: renombrar variable confusa
- [ ] Mejora: extraer funcion validateField
```

---

## PROCESO DE DECISION ATOMICA

### Paso 1: Clarificar objetivo

```markdown
## Objetivo confirmado

Tarea: [descripcion clara y especifica]
Scope: [archivos/modulos afectados]
NO incluye: [que esta fuera de scope]
```

### Paso 2: Planificar cambio minimo

```markdown
## Plan de cambios

1. [Cambio en archivo A]
2. [Cambio en archivo B]
3. [Verificacion]

Total: [N] archivos, [M] lineas aprox.
```

### Paso 3: Ejecutar y verificar

```markdown
## Ejecucion

- [x] Cambio en archivo A - OK
- [x] Cambio en archivo B - OK
- [x] Build pasa - OK
- [x] Tests pasan - OK

## Objetivo cumplido: SI
```

### Paso 4: Siguiente objetivo

```markdown
## Siguiente tarea (si hay)

El objetivo anterior esta completo.
Quieres que continue con [siguiente objetivo]?
```

---

## REGLAS PARA EL AGENTE

### HACER:
- Pedir clarificacion si hay multiples objetivos
- Listar objetivos detectados
- Proponer orden de ejecucion
- Ejecutar de uno en uno
- Confirmar completitud antes de siguiente

### NO HACER:
- Mezclar objetivos no relacionados
- "Aprovechar" para hacer cambios extra
- Asumir que el usuario quiere todo junto
- Empezar siguiente sin confirmar anterior

---

## SCOPE CREEP: COMO MANEJARLO

```markdown
## Alerta: Scope creep detectado

Durante la tarea de "agregar validacion de email", descubri:
- Bug en validacion de telefono
- Oportunidad de refactor en el form
- Inconsistencia de estilos

## Opciones

1. [ ] Ignorar y seguir con objetivo original
2. [ ] Anotar como tareas futuras
3. [ ] Pausar y priorizar lo descubierto

## Recomendacion

Opcion 2: Completar objetivo actual, anotar descubrimientos.

Tareas anotadas:
- [ ] PENDIENTE: Bug validacion telefono
- [ ] PENDIENTE: Refactor form
- [ ] PENDIENTE: Revisar estilos
```

---

## FORMATO DE CIERRE ATOMICO

```markdown
## Cierre de objetivo

### Objetivo: [descripcion]
### Estado: COMPLETADO

### Cambios realizados:
| Archivo | Cambio |
|---------|--------|
| file.ts | Agregado X |
| file2.ts | Modificado Y |

### Verificacion:
- [x] Build OK
- [x] Tests OK
- [x] Funcionalidad verificada

### Descubrimientos para despues:
1. [Tarea futura 1]
2. [Tarea futura 2]

### Proximo objetivo (si aplica):
[Descripcion o "Ninguno, esperando instrucciones"]
```

---

## Verificacion

- [ ] Solo 1 objetivo por iteracion?
- [ ] Scope claramente definido?
- [ ] Sin cambios "aprovechando"?
- [ ] Objetivo completado antes de siguiente?
- [ ] Descubrimientos anotados, no ejecutados?

---

*Atomico = controlable. Mezclar = caos.*
