# WORKFLOW: DEBUG

Activar con: `/debug [error]`

---

## Proposito
Debuggear errores de forma sistematica sin entrar en bucles.

---

## Pasos

### 1. Capturar informacion
```
Error: [mensaje exacto]
Donde: [archivo:linea]
Cuando: [accion que lo dispara]
Frecuencia: [siempre/a veces/primera vez]
```

### 2. Reproducir
```
Pasos para reproducir:
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]
-> Error aparece

Reproducible: SI / NO / A VECES
```

### 3. Generar hipotesis (max 3)

| # | Hipotesis | Como verificar |
|---|-----------|----------------|
| 1 | [Hipotesis 1] | [Experimento] |
| 2 | [Hipotesis 2] | [Experimento] |
| 3 | [Hipotesis 3] | [Experimento] |

### 4. Probar hipotesis (una a una)

```markdown
## Hipotesis 1: [nombre]

### Experimento
[Que voy a hacer para verificar]

### Resultado
[Que paso]

### Conclusion
CONFIRMADA / DESCARTADA

---
(Si descartada, pasar a hipotesis 2)
```

### 5. Implementar fix

```markdown
## Fix aplicado

### Causa raiz
[Explicacion de por que ocurria]

### Solucion
[Que se cambio]

### Verificacion
- [ ] Error ya no aparece
- [ ] Tests pasan
- [ ] No hay regresiones
```

---

## Reglas anti-bucle

- Max 2 intentos por hipotesis
- Si 3 hipotesis fallan -> PARAR y escalar
- No probar variaciones menores del mismo fix
- Documentar todo intento

---

## Output esperado
Fix implementado con causa raiz documentada.

