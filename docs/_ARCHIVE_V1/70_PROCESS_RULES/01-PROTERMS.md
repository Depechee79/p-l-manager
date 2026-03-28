# 01-PROTERMS - COMANDOS DE PETICION
> Version 2.0 | Enero 2026
> Idioma de comunicacion con agentes IA

---

## PROPOSITO

Este archivo define el lenguaje estandarizado para comunicarse con agentes IA.
Usar estos terminos garantiza que el agente entienda exactamente que se pide.

---

## 1. PREFIJOS DE PETICION

| Prefijo | Significado | Cambios permitidos | Ejemplo |
|---------|-------------|-------------------|---------|
| **PLAN:** | Solo planificar | CERO | PLAN: como refactorizaria el menu |
| **AUDITA:** | Diagnostico/inventario | CERO | AUDITA: estado del componente Header |
| **APLICA:** | Ejecutar cambios | Pide confirmacion | APLICA: corrige el bug del boton |
| **DEBUG:** | Investigar problema | CERO | DEBUG: por que falla el login |
| **EXPLICA:** | Entender codigo | CERO | EXPLICA: que hace esta funcion |

### Regla fundamental:
- Si el prefijo indica CERO cambios, el agente NO puede modificar nada
- APLICA: siempre requiere confirmacion antes de ejecutar

---

## 2. CONFIRMACIONES

| Frase | Cuando usarla | Que permite |
|-------|---------------|-------------|
| **OK EJECUTA** | Tras ver comandos propuestos | Ejecutar comandos mostrados |
| **OK CAMBIOS** | Tras ver cambios propuestos | Aplicar cambios de codigo |
| **OK PROD** | Para acciones en produccion | Deploy, cambios de infra |
| **SI / ADELANTE** | Confirmacion generica | Continuar con lo propuesto |
| **STOP** | Detener ejecucion | Parar inmediatamente |
| **VOLVER** | Deshacer ultimo paso | Revertir cambio reciente |

### Regla:
- Sin confirmacion explicita, el agente NO puede ejecutar acciones significativas
- Silencio NO es aprobacion

---

## 3. METAPROCESOS

### PR Atomico / Cambio Atomico
**Que es:** Un cambio pequeno enfocado a UN solo objetivo.

**Como pedirlo:**
```
"Haz un cambio atomico: SOLO arregla X, sin tocar Y ni Z"
"No refactorices nada mas, unicamente corrige el bug del login"
```

**Por que importa:** Reduce regresiones y facilita encontrar que rompio que.

---

### DoD (Definition of Done)
**Que es:** Criterios objetivos para considerar algo terminado.

**Checklist tipico:**
- Build compila sin errores
- Tests pasan
- 0 errores en consola
- Lint ok
- Funciona en movil y desktop

**Como pedirlo:**
```
"DoD obligatorio: build ok + tests ok + 0 errores consola + lint clean"
"No consideres terminado hasta cumplir DoD"
```

---

### Scope Control / No-Regression
**Que es:** Limitar que se toca y exigir no romper lo existente.

**Como pedirlo:**
```
"Scope limitado: NO cambies estilos, NO toques otras funciones, SOLO corrige X"
"Prohibido modificar archivos fuera de /components/Menu/"
"Antes de terminar, verifica que login y dashboard siguen funcionando"
```

---

### RCA (Root Cause Analysis)
**Que es:** Encontrar la CAUSA REAL, no parchear sintomas.

**Como pedirlo:**
```
"Haz RCA antes de tocar codigo:
 1. Cual es la causa raiz?
 2. Que impacto tiene?
 3. Cual es el fix minimo?
 4. Que test lo cubriria?"
```

**Por que importa:** Evita el ciclo infinito de "arreglo esto, se rompe aquello".

---

### Repro Steps (Pasos de Reproduccion)
**Que es:** Secuencia exacta para reproducir un bug.

**Como pedirlo:**
```
"Primero documenta:
 - Pasos para reproducir (1, 2, 3...)
 - Expected: que deberia pasar
 - Actual: que pasa realmente
 - Entorno: navegador, movil/desktop"
```

---

### Regression Test
**Que es:** Test que verifica que algo arreglado no se vuelva a romper.

**Como pedirlo:**
```
"Anade regression test que:
 1. FALLE antes del fix
 2. PASE despues del fix
 Asi si vuelve el bug, el test lo detecta"
```

---

## 4. FRASES UTILES POR SITUACION

### Para pedir diagnostico:
- "Antes de tocar nada, explicame que hace este codigo"
- "Cual es la causa raiz del problema?"
- "Que archivos afecta este cambio?"

### Para limitar alcance:
- "SOLO toca el archivo X, no modifiques nada mas"
- "Cambio atomico: una cosa, bien hecha"
- "Scope limitado a /components/Menu/"

### Para verificar:
- "Antes de terminar, verifica que no rompiste nada"
- "DoD: build ok + app carga + funcionalidad verificada"
- "Checklist: build, lint, tests"

### Para debugging:
- "Anade logs de debug para rastrear el flujo"
- "Haz bisect para encontrar cuando empezo a fallar"
- "Explicame paso a paso que hace este codigo"

### Para refactorizar:
- "Refactoriza para legibilidad, sin cambiar funcionalidad"
- "Aplica SoC: separa logica de negocio de la UI"
- "KISS: simplifica, esto esta over-engineered"

---

## 5. DIAGNOSTICO RAPIDO

| Problema | Terminos a usar |
|----------|-----------------|
| Bug que no encuentro | RCA, Bisect, Repro Steps |
| Codigo desordenado | Refactor, SoC, Modularizar |
| Cambios rompen cosas | Scope Control, Regression Test |
| No se que hace el codigo | EXPLICA:, paso a paso |
| Demasiada complejidad | KISS, simplifica |
| Codigo repetido | DRY, extrae funcion |
| Agente cambia de mas | DoD, Scope Control, PR Atomico |
| No se si esta bien | Unit tests, E2E, code review |

---

## 6. REGLA DE ORO

```
ANTES: "Arreglame el boton que no funciona"

DESPUES: "El boton de guardar falla. Haz RCA, identifica la causa raiz,
         aplica fix minimo, anade regression test.
         DoD: build ok + 0 errores consola"
```

**Mejor un prompt largo y preciso que 10 prompts cortos y vagos.**

---

*Este archivo define el idioma de comunicacion con agentes IA.*
