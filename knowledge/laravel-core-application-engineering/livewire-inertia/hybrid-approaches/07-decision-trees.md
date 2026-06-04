# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Hybrid Approaches
**Generated:** 2026-06-03

---

# Decision Inventory

* Single Stack vs Hybrid Livewire + Inertia
* Route-Level Segregation vs Page-Level Segregation
* Gradual Migration vs Big Bang Stack Switch

---

# Architecture-Level Decision Trees

---

## Decision 1: Single Stack vs Hybrid Livewire + Inertia

---

## Decision Context

Whether to use a single frontend stack (Livewire or Inertia alone) or a hybrid approach using both in different sections of the application.

---

## Decision Criteria

* Whether different sections of the app have fundamentally different interactivity needs
* Whether the team has expertise in both stacks
* Whether the application is small enough that one stack suffices
* Whether the admin panel and public site need different approaches

---

## Decision Tree

Is the application small (<20 routes, simple CRUD, single team)?
↓
YES → Single stack — either Livewire or Inertia, not both
NO → Does the application have distinctly different sections (admin panel + public site)?
    YES → Does the admin section need simple CRUD and the public site need complex UI?
        YES → Hybrid — Livewire for admin, Inertia for public site
        NO → Does the admin section need complex interactivity (dashboards, charts)?
            YES → Single stack (either) — the app's needs are consistent across sections
            NO → Single stack — no reason to split
NO → Is the team proficient in both stacks?
    YES → Hybrid — each section uses the optimal tool
    NO → Single stack the team knows — team skill trumps technical optimization

---

## Rationale

Hybrid approaches add complexity: two rendering pipelines, two frontend build setups, two component directories. This is only justified when sections have fundamentally different interactivity needs (admin CRUD vs public SPA) and the team can support both stacks. For most applications, a single stack is simpler and sufficient.

---

## Recommended Default

**Default:** Single stack. Hybrid only for applications with distinctly different sections (admin + public) and a team proficient in both.
**Reason:** Hybrid doubles frontend infrastructure complexity. Only justified when sections have truly different needs and the team can maintain both stacks.

---

## Risks Of Wrong Choice

* Hybrid for small app: Double the infrastructure for no benefit — build tools, routing, component patterns
* Single stack for split needs: Admin panel suffers from JS framework overhead, public site limited by server rendering
* Hybrid without team expertise: One stack poorly implemented — bugs, performance issues, maintenance burden
* Stack overlap on same page: Livewire in Inertia page — conflicts between rendering pipelines

---

## Related Rules

* Route-Level Stack Segregation

---

## Related Skills

* Implement Route-Level Stack Segregation

---

---

## Decision 2: Route-Level Segregation vs Page-Level Segregation

---

## Decision Context

Whether to segregate Livewire and Inertia at the route level (each route uses exclusively one stack) or attempt to use both on the same page.

---

## Decision Criteria

* Whether a single page needs both stacks (should be avoided)
* Whether route prefixes naturally divide the app (e.g., /admin/ vs /app/)
* Whether the team can enforce no-stack-mixing discipline
* Whether there is legacy code that embeds one stack in the other

---

## Decision Tree

Does any single page need rendering from both stacks?
↓
YES → Choose ONE stack for that page — never mix on the same page
NO → Do routes naturally segment by prefix (/admin/* → Livewire, /* → Inertia)?
    YES → Route-level segregation by prefix — clean, enforceable, predictable
    NO → Does the app have mostly one stack with occasional sections in the other?
        YES → Route-level segregation by route group — clear boundaries
        NO → Route-level segregation — always separate by route, never by page section

---

## Rationale

Livewire manages HTML via DOM diffing, while Inertia manages the full page via client-side navigation. These two paradigms conflict — Livewire's AJAX updates break Inertia's navigation protocol, and Inertia's SPA routing bypasses Livewire's lifecycle. Mixing on the same page produces unpredictable behavior. Route-level segregation is the only supported approach.

---

## Recommended Default

**Default:** Strict route-level segregation. Never render both stacks on the same page.
**Reason:** Livewire and Inertia have incompatible rendering pipelines. Mixing causes DOM conflicts, double state management, and unpredictable navigation behavior.

---

## Risks Of Wrong Choice

* Mixing on same page: Livewire's DOM diffing breaks Inertia's navigation state — page crashes
* No clear prefix boundary: Developers don't know which stack to use for a new route — inconsistent
* Legacy embedded Livewire in Inertia: Unexpected behavior on form submission — Inertia intercepts Livewire's request
* Gradual migration without segregation: Half-migrated pages break — worst of both worlds

---

## Related Rules

* Route-Level Stack Segregation

---

## Related Skills

* Implement Route-Level Stack Segregation

---

---

## Decision 3: Gradual Migration vs Big Bang Stack Switch

---

## Decision Context

Whether to migrate from one stack to another gradually (route by route) or all at once (big bang switch).

---

## Decision Criteria

* Number of routes/sections to migrate
* Whether the application can run with both stacks during migration
* Whether the team has dedicated time for a complete migration
* Whether there are dependencies between sections that prevent partial migration

---

## Decision Tree

Is the migration from Livewire to Inertia (or vice versa)?
↓
YES → Can routes be migrated independently (no shared state between sections)?
    YES → Gradual migration — migrate route group by route group, run both stacks during transition
    NO → Big bang migration — dependent sections must be migrated together
NO → Is the migration from a legacy frontend (jQuery, Alpine-only) to a stack?
    YES → Gradual migration — islands pattern, new routes use new stack
    NO → Does the team have 2+ weeks of uninterrupted migration time?
        YES → Big bang — faster, cleaner break, no dual-maintenance period
        NO → Gradual — reduce risk, migrate in phases

---

## Rationale

Gradual migration reduces risk by allowing both stacks to coexist during the transition. Each migrated route is validated independently. Big bang migration is faster but riskier — if something goes wrong, the entire app is affected. Gradual migration requires route-level segregation (already recommended), which naturally supports phase-by-phase migration.

---

## Recommended Default

**Default:** Gradual migration — route group by route group. Both stacks coexist during the transition period.
**Reason:** Gradual migration enables per-route validation, rollback of individual routes, and team learning without blocking the entire application. Big bang is only justified when sections are tightly interdependent.

---

## Risks Of Wrong Choice

* Big bang with no rollback: Migration breaks production — entire app affected, rollback is full revert
* Gradual without clear boundaries: New routes created in old stack — migration scope creeps
* Migration without test coverage: Undetected regressions in migrated routes
* Dual-stack maintenance too long: Team maintains both stacks indefinitely — never finishes migration

---

## Related Rules

* Route-Level Stack Segregation

---

## Related Skills

* Implement Route-Level Stack Segregation
