# WORKFLOW: PLAN

Activar con: `/plan [feature]`

---

## Proposito
Planificar implementacion de una feature antes de escribir codigo.

---

## Pasos

### 1. Entender requisitos
```
Que se quiere lograr?
- Objetivo principal:
- Usuarios afectados:
- Criterios de exito:
```

### 2. Analizar impacto
```
Archivos a modificar:
- [ ] [archivo1] - [cambio]
- [ ] [archivo2] - [cambio]

Archivos nuevos:
- [ ] [archivo] - [proposito]

Dependencias nuevas:
- [ ] [dependencia] - [razon]
```

### 3. Disenar solucion

```markdown
## Diseno Tecnico

### Componentes
- [Componente1]: [responsabilidad]
- [Componente2]: [responsabilidad]

### Flujo de datos
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

### API/Contratos
- Input: [tipo]
- Output: [tipo]
```

### 4. Definir pasos de implementacion

```markdown
## Plan de Implementacion

### Fase 1: [nombre]
- [ ] Tarea 1
- [ ] Tarea 2

### Fase 2: [nombre]
- [ ] Tarea 3
- [ ] Tarea 4

### Testing
- [ ] Unit tests para [X]
- [ ] Integration test para [Y]
```

### 5. Identificar riesgos

| Riesgo | Probabilidad | Mitigacion |
|--------|--------------|------------|
| [Riesgo 1] | Alta/Media/Baja | [Como mitigar] |

---

## Output esperado
Plan de implementacion aprobado antes de escribir codigo.

