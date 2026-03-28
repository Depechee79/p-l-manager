# REGLA: Protocolo Anti-Bucle

---

## Cuando aplica
- Cuando un error se repite 2+ veces
- Cuando un fix no funciona
- Cuando el agente parece "dar vueltas"

---

## Objetivo
Prevenir que el agente entre en loops infinitos de intentos fallidos.
Previene: tiempo perdido, frustracion, cambios que empeoran las cosas.

---

## DEFINICION DE BUCLE

Un bucle ocurre cuando:
- El mismo error aparece 2+ veces consecutivas
- El mismo sintoma persiste despues de 2 intentos de fix
- El agente propone la misma solucion que ya fallo
- Los cambios causan nuevos errores que llevan al error original

---

## PROTOCOLO DE DETECCION

### Paso 1: Detectar

El agente DEBE rastrear:

```markdown
## Historial de intentos

| # | Intento | Resultado | Error |
|---|---------|-----------|-------|
| 1 | Cambiar import a named | Fallo | Module not found |
| 2 | Cambiar a default import | Fallo | Module not found |
| 3 | ??? | - | - |

ALERTA: Error "Module not found" ha aparecido 2 veces.
```

### Paso 2: PARAR

**INMEDIATAMENTE al detectar bucle:**

```markdown
## BUCLE DETECTADO - EJECUCION PAUSADA

Error repetido: "Module not found"
Intentos fallidos: 2
Mismo sintoma, misma causa

NO voy a intentar el mismo approach de nuevo.
```

### Paso 3: Analizar

```markdown
## Analisis del bucle

### Que se intento:
1. Cambiar tipo de import
2. Verificar path
3. Reinstalar dependencia

### Que NO funciono:
- Cambios en el import
- El error persiste identico

### Posibles causas no exploradas:
1. El modulo no esta instalado (verificar node_modules)
2. El path es incorrecto (verificar estructura real)
3. Configuracion de TS/bundler (verificar tsconfig)
4. Cache de build (limpiar .next, dist, etc)
```

### Paso 4: Proponer alternativa

```markdown
## Hipotesis alternativa

**Nueva hipotesis:** El problema no es el import, es que el modulo
no existe en node_modules por un error de instalacion.

**Experimento minimo:**
1. Verificar: `ls node_modules/modulo-x`
2. Si no existe: `npm install modulo-x`
3. Si existe: revisar version vs peer deps

**Confirmacion requerida:**
Quieres que intente esta hipotesis?
[ ] Si, procede
[ ] No, prefiero otro enfoque
```

---

## LIMITES ESTRICTOS

| Metrica | Limite | Accion |
|---------|--------|--------|
| Mismo error | 2 veces | PARAR + analizar |
| Intentos de fix | 3 max | PARAR + proponer RCA |
| Tiempo en mismo problema | 15 min | PARAR + escalar |

---

## ESCALACION

Si despues del protocolo anti-bucle el problema persiste:

```markdown
## Escalacion requerida

He intentado 3 enfoques sin exito:
1. [Enfoque 1] - Resultado: [...]
2. [Enfoque 2] - Resultado: [...]
3. [Enfoque 3] - Resultado: [...]

Recomendaciones:
- Consultar documentacion oficial de [X]
- Buscar el error exacto en GitHub issues
- Pedir ayuda a especialista en [area]
- Crear minimal repro y reportar bug

Que quieres que haga?
```

---

## SENALES DE BUCLE INMINENTE

El agente DEBE alertar si detecta:

```markdown
## Alerta: Posible bucle inminente

Detecto patrones de riesgo:
- [ ] Estoy deshaciendo un cambio que acabo de hacer
- [ ] El error es similar al anterior
- [ ] No tengo nueva informacion para intentar algo diferente
- [ ] El fix propuesto es variacion minima del anterior

Recomiendo: PARAR y hacer analisis profundo antes de continuar.
```

---

## FORMATO DE REPORTE DE BUCLE

```markdown
## Reporte de bucle

### Resumen
- Error: [descripcion]
- Intentos: [N]
- Tiempo invertido: [X min]

### Historial de intentos
| # | Accion | Resultado | Aprendizaje |
|---|--------|-----------|-------------|
| 1 | ... | Fallo | ... |
| 2 | ... | Fallo | ... |

### Hipotesis descartadas
1. [Hipotesis 1] - Descartada porque [razon]
2. [Hipotesis 2] - Descartada porque [razon]

### Hipotesis pendientes
1. [Nueva hipotesis] - Requiere [informacion/accion]

### Recomendacion
[Que hacer a continuacion]
```

---

## REGLAS ABSOLUTAS

### EL AGENTE DEBE:
- Contar intentos de cada tipo de solucion
- PARAR al detectar repeticion
- Documentar que se intento
- Proponer algo DIFERENTE, no variacion

### EL AGENTE NUNCA DEBE:
- Intentar lo mismo mas de 2 veces
- Ignorar errores repetidos
- "Probar suerte" con variaciones menores
- Continuar sin confirmar nueva direccion

---

## Verificacion

- [ ] Intentos siendo rastreados?
- [ ] PARAR automatico al 2do error igual?
- [ ] Hipotesis alternativa propuesta?
- [ ] Nueva direccion confirmada antes de continuar?
- [ ] Bucle documentado si ocurrio?

---

*Repetir lo mismo esperando resultado diferente = locura.*
