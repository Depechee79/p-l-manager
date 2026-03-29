# Decisiones de Producto — RESUELTAS

> Todas las decisiones fueron tomadas por Aitor el 29 de marzo 2026.
> Todas eligieron la opcion A (maxima calidad, preparada para produccion).
> Todas fueron implementadas en la sesion #007.

---

## DP-1: Auth real (Firebase Auth) — IMPLEMENTADA

**Decision:** Opcion A — Migrar a Firebase Auth real.
**Sesion:** #007
**Cambios:** AppContext.tsx usa onAuthStateChanged, localStorage eliminado, User type expandido con uid/email/restaurantIds.

---

## DP-2: Firestore rules endurecidas — IMPLEMENTADA

**Decision:** Opcion A — Migrar datos + endurecer reglas.
**Sesion:** #007
**Cambios:** 15 colecciones con canAccessDocument() + hasRestaurantAccess(). 5 colecciones HR anadidas a RESTAURANT_FILTERED_COLLECTIONS.
**Pendiente:** Deploy rules a Firebase, backfill restaurantId en datos legacy.

---

## DP-3: Timestamps nativos — IMPLEMENTADA

**Decision:** Opcion A — Migrar todo a Timestamp.
**Sesion:** #007
**Cambios:** BaseEntity acepta string | Timestamp, writes usan Timestamp.now(), 17 archivos migrados a formatDateOnly(), dateUtils.ts creado.

---

## DP-4: Tokens seguros — IMPLEMENTADA

**Decision:** Opcion A — crypto.getRandomValues() en cliente.
**Sesion:** #007
**Cambios:** generateInvitationToken() y generateRestaurantCode() usan crypto.getRandomValues().

---

## DP-5: OCR Claude API Vision — PENDIENTE IMPLEMENTACION

**Decision:** Opcion A — Claude API Vision (o alternativa fiable y barata).
**Bloqueadores:** Necesita Cloud Functions (europe-west1) + API key Anthropic como Firebase secret.
**Alternativas evaluadas:** Google Cloud Vision AI (mas barato), Mistral Vision.
**Plan detallado:** Ver plan de sesion en `.claude/plans/cosmic-weaving-forest.md` Fase 8.
