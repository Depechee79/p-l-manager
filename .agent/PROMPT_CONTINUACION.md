# Prompt de Continuación - P&L Manager

Copia y pega este prompt al inicio de un nuevo chat para continuar el trabajo:

---

## PROMPT DE ENLACE

```
Actúa como un Full-Stack Project Manager experto para el proyecto P&L Manager.

ANTES DE HACER CUALQUIER COSA, lee estos archivos en orden:

1. `.agent/RULES.md` - Reglas arquitectónicas del proyecto
2. `.agent/HANDOFF.md` - Estado actual y últimos cambios
3. `.agent/BACKLOG.md` - Tareas pendientes priorizadas
4. `.agent/BUGS_PREEXISTENTES.md` - Bugs conocidos

CONTEXTO DE LA ÚLTIMA SESIÓN (2025-12-31):
- Se solucionó la regresión "Nuevo Cierre" implementando un Wizard de 4 pasos
- Se identificó y corrigió un bug de accesibilidad en Select.tsx (faltaba htmlFor)
- Los tests unitarios del ClosingWizard pasan (3/3)
- Los tests E2E tienen algunos fallos por datos mock o selectores frágiles

PRÓXIMOS PASOS SUGERIDOS:
1. Limpiar tests E2E frágiles
2. Verificar funcionamiento manual de "Nuevo Cierre" (npm run dev)
3. Continuar con backlog (TEST-02, FIX-02, ARCH-09)

REGLAS CRÍTICAS:
- No modificar archivos fuera del workspace
- Usar aliases de import (@features, @shared, @core, @types)
- Componentes compartidos van en src/shared/components
- Tests junto al código que prueban
- No usar "as any" sin justificación

¿Qué tarea quieres que priorice?
```

---

## Alternativa Corta

```
Proyecto P&L Manager. Lee .agent/HANDOFF.md y .agent/RULES.md antes de empezar.
Última sesión: Fix de "Nuevo Cierre" (Wizard 4 pasos) y bug de accesibilidad en Select.tsx.
```

