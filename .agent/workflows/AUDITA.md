# WORKFLOW: AUDITA

Activar con: `/audita [scope]`

---

## Proposito
Auditar codigo existente para detectar problemas y proponer mejoras.

---

## Pasos

### 1. Definir scope
```
Que quieres auditar?
[ ] Archivo especifico
[ ] Carpeta/modulo
[ ] Proyecto completo
```

### 2. Ejecutar checks

| Check | Que busca |
|-------|-----------|
| Tipos | any, unknown sin narrowing |
| Seguridad | Inputs sin validar, secrets expuestos |
| Performance | Re-renders, fetches innecesarios |
| Accesibilidad | Alt faltantes, contraste, teclado |
| Code smells | Funciones largas, duplicacion |

### 3. Generar reporte

```markdown
## Reporte de Auditoria

### Archivo: [nombre]
### Fecha: [fecha]

### Criticos (arreglar ya)
- [ ] [Descripcion] - Linea X

### Importantes (arreglar pronto)
- [ ] [Descripcion] - Linea X

### Menores (cuando se pueda)
- [ ] [Descripcion] - Linea X

### Recomendaciones
1. [Recomendacion 1]
2. [Recomendacion 2]
```

### 4. Proponer fixes
Para cada issue critico, proponer solucion concreta.

---

## Output esperado
Reporte markdown con issues priorizados y fixes propuestos.

