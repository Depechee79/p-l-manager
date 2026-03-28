# P&L Manager — Contexto

> Sintesis para que un agente nuevo entienda el proyecto en 2 minutos.

## Que es
Gestor de operaciones diarias de hosteleria. Cierres de caja, albaranes, inventarios, escandallos, personal, horarios.

## Stack
React 19 + TypeScript 5.9 + Vite 7.2 + Firebase (pylhospitality) + Tailwind CSS 4

## Arquitectura
Single app (puerto 3004). Feature-based: src/core (infra), src/shared (design system), src/features (modulos), src/pages (composicion).

## Estado
- 5 sesiones completadas
- 51 tests
- Build OK
- Gobernanza completa implantada (sesion #005)
- 8 modulos existentes + 4 previstos

## Gobernanza
- CLAUDE.md: constitucion del proyecto
- .claude/rules/: 5 reglas (suprema + 4 dominio)
- docs/contracts/: 12 contratos especializados
- .claude/skills/: 6 skills (scanner, inspector, verificar, sesion, firebase-guide, design-system)

## Clave
- Aitor es director de restaurante, NO programador
- Calidad maxima siempre
- Mobile-first (camareros con movil)
- Multi-restaurante y grupos
- Claude API Vision para documentos (NO Tesseract)
