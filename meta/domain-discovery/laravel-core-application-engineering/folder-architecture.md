# Structure Rationale

The folder architecture for Laravel Core Application Engineering follows two organizing principles:

**1. Technical layer first, concept second.** Laravel developers navigate by technical layer (routing, controllers, middleware) before business concept. Top-level subdomains mirror how Laravel itself organizes code — `app/Http/Controllers`, `app/Http/Middleware`, `app/Http/Requests`, `app/Http/Resources` — because ECC knowledge must be findable by developers thinking in framework-native terms.

**2. Separate concerns that are commonly conflated.** Service Layer and Action Pattern are sibling subdomains (not merged) because the most common architectural failure in Laravel teams is conflating them. Form Requests and DTOs are separate (not merged) because their boundaries are consistently misunderstood. Livewire and Inertia share a subdomain but are separate leaf hierarchies because the selection decision is the most valuable knowledge unit.

## Design Rules Applied

- Each Knowledge Unit is a leaf node (file).
- Subdomains are directories containing related Knowledge Units.
- No single-file directories — if a topic has only one Knowledge Unit, it lives at the parent level.
- Directory names are kebab-case, matching ECC naming conventions.
- The tree is shallow (2-3 levels max) to avoid burying knowledge.
- Future topics add leaf nodes within existing subdomains; new subdomains are added only when a topic cannot fit existing structure.

---

# Proposed ECC Folder Tree

```
knowledge/
└── laravel-core-application-engineering/
    ├── _index.md                              (domain overview, navigation)
    │
    ├── application-architecture/
    │   ├── _index.md                          (subdomain overview)
    │   ├── bootstrapping-lifecycle.md         (Foundation)
    │   ├── service-container-basics.md        (Foundation)
    │   ├── service-provider-strategies.md     (Intermediate)
    │   ├── directory-conventions.md           (Foundation)
    │   ├── configuration-management.md        (Intermediate)
    │   └── application-localization.md        (Intermediate)
    │
    ├── routing/
    │   ├── _index.md
    │   ├── route-definition.md                (Foundation)
    │   ├── resourceful-routing.md             (Foundation)
    │   ├── singleton-routes.md                (Intermediate)
    │   ├── route-model-binding-implicit.md    (Foundation)
    │   ├── route-model-binding-explicit.md    (Advanced)
    │   ├── custom-route-keys.md               (Intermediate)
    │   ├── scoped-bindings.md                 (Advanced)
    │   ├── enum-binding.md                    (Advanced)
    │   ├── route-groups.md                    (Intermediate)
    │   ├── rate-limiting.md                   (Advanced)
    │   ├── signed-routes.md                   (Intermediate)
    │   ├── route-caching.md                   (Intermediate)
    │   ├── api-versioning.md                  (Advanced)
    │   └── route-name-generation.md           (Foundation)
    │
    ├── controllers/
    │   ├── _index.md
    │   ├── controller-architecture.md         (Foundation)
    │   ├── resource-controllers.md            (Foundation)
    │   ├── single-action-controllers.md       (Intermediate)
    │   ├── dependency-injection.md            (Intermediate)
    │   ├── controller-middleware.md           (Intermediate)
    │   ├── thin-controller-principles.md      (Advanced)
    │   ├── controller-organization.md         (Intermediate)
    │   └── controller-testing.md              (Intermediate)
    │
    ├── service-layer/
    │   ├── _index.md
    │   ├── service-class-design.md            (Intermediate)
    │   ├── naming-conventions.md              (Foundation)
    │   ├── service-orchestration.md           (Advanced)
    │   ├── transaction-management.md          (Advanced)
    │   ├── stateless-service-design.md        (Intermediate)
    │   ├── service-testing.md                 (Intermediate)
    │   ├── service-vs-action-decision.md      (Expert)
    │   └── domain-vs-application-services.md  (Expert)
    │
    ├── action-pattern/
    │   ├── _index.md
    │   ├── action-class-design.md             (Intermediate)
    │   ├── action-naming-conventions.md       (Foundation)
    │   ├── action-composition.md              (Advanced)
    │   ├── transactional-actions.md           (Advanced)
    │   ├── queued-actions.md                  (Expert)
    │   ├── use-case-variant.md                (Expert)
    │   ├── action-testing.md                  (Intermediate)
    │   └── action-vs-service-vs-usecase.md    (Expert)
    │
    ├── middleware/
    │   ├── _index.md
    │   ├── middleware-fundamentals.md         (Foundation)
    │   ├── middleware-lifecycle.md            (Foundation)
    │   ├── global-route-group-middleware.md   (Intermediate)
    │   ├── custom-middleware.md               (Intermediate)
    │   ├── parameterized-middleware.md        (Advanced)
    │   ├── terminable-middleware.md           (Advanced)
    │   ├── middleware-ordering-priority.md    (Advanced)
    │   ├── request-transformation.md          (Advanced)
    │   ├── response-transformation.md         (Advanced)
    │   ├── middleware-testing.md              (Intermediate)
    │   ├── cross-cutting-concerns.md          (Expert)
    │   └── laravel-11-vs-10-registration.md   (Intermediate)
    │
    ├── form-requests-validation/
    │   ├── _index.md
    │   ├── form-request-fundamentals.md       (Foundation)
    │   ├── authorization-in-requests.md       (Intermediate)
    │   ├── validation-rule-patterns.md        (Intermediate)
    │   ├── custom-validation-rules.md         (Intermediate)
    │   ├── conditional-validation.md          (Advanced)
    │   ├── after-validation-hooks.md          (Advanced)
    │   ├── input-preparation.md               (Intermediate)
    │   ├── request-organization.md            (Intermediate)
    │   ├── form-request-dto-integration.md    (Advanced)
    │   ├── manual-validator-usage.md          (Intermediate)
    │   └── form-request-testing.md            (Intermediate)
    │
    ├── dtos/
    │   ├── _index.md
    │   ├── dto-fundamentals.md                (Foundation)
    │   ├── readonly-data-objects.md           (Intermediate)
    │   ├── dto-construction-patterns.md       (Intermediate)
    │   ├── nested-dtos.md                     (Advanced)
    │   ├── spatie-laravel-data.md             (Intermediate)
    │   ├── data-object-validation.md          (Advanced)
    │   ├── data-object-transformation.md      (Advanced)
    │   ├── dto-vs-form-request.md             (Advanced)
    │   ├── dto-vs-value-object.md             (Expert)
    │   ├── dto-organization.md                (Intermediate)
    │   ├── dto-testing.md                     (Intermediate)
    │   └── when-not-to-use-dtos.md            (Intermediate)
    │
    ├── api-resources/
    │   ├── _index.md
    │   ├── resource-fundamentals.md           (Foundation)
    │   ├── resource-collections.md            (Foundation)
    │   ├── conditional-attributes.md          (Intermediate)
    │   ├── conditional-relationships.md       (Intermediate)
    │   ├── pagination-metadata.md             (Intermediate)
    │   ├── top-level-meta-data.md             (Advanced)
    │   ├── data-wrapping.md                   (Intermediate)
    │   ├── json-api-resources.md              (Advanced)
    │   ├── sparse-fieldsets.md                (Advanced)
    │   ├── versioned-resources.md             (Advanced)
    │   ├── resource-organization.md           (Intermediate)
    │   ├── resource-testing.md                (Intermediate)
    │   └── resource-vs-dto-decision.md        (Expert)
    │
    ├── blade-view-layer/
    │   ├── _index.md
    │   ├── template-inheritance.md            (Foundation)
    │   ├── component-system.md                (Foundation)
    │   ├── slots-and-stacks.md                (Intermediate)
    │   ├── custom-directives.md               (Intermediate)
    │   ├── service-injection.md               (Intermediate)
    │   ├── view-composers-creators.md         (Intermediate)
    │   ├── view-models-presenters.md          (Advanced)
    │   ├── layout-strategies.md               (Intermediate)
    │   ├── localization-in-views.md           (Foundation)
    │   ├── blade-fragments.md                 (Advanced)
    │   ├── blade-with-alpine.md               (Intermediate)
    │   ├── rendering-performance.md           (Advanced)
    │   └── blade-testing.md                   (Intermediate)
    │
    ├── livewire-inertia/
    │   ├── _index.md
    │   ├── livewire/
    │   │   ├── component-architecture.md      (Foundation)
    │   │   ├── data-binding.md                (Foundation)
    │   │   ├── actions-events.md              (Intermediate)
    │   │   ├── lifecycle-hooks.md             (Advanced)
    │   │   ├── loading-states.md              (Intermediate)
    │   │   ├── validation.md                  (Intermediate)
    │   │   ├── file-uploads.md                (Intermediate)
    │   │   ├── volatile-properties.md         (Advanced)
    │   │   ├── lazy-loading.md                (Advanced)
    │   │   ├── islands-pattern.md             (Expert)
    │   │   └── testing.md                     (Intermediate)
    │   │
    │   ├── inertia/
    │   │   ├── page-components.md             (Foundation)
    │   │   ├── server-props.md                (Foundation)
    │   │   ├── shared-data.md                 (Intermediate)
    │   │   ├── form-handling.md               (Intermediate)
    │   │   ├── partial-reloads.md             (Advanced)
    │   │   ├── lazy-data-evaluation.md        (Advanced)
    │   │   ├── typescript-integration.md      (Advanced)
    │   │   ├── ssr-configuration.md           (Expert)
    │   │   └── testing.md                     (Intermediate)
    │   │
    │   ├── stack-selection-guide.md           (Expert)
    │   └── hybrid-approaches.md               (Expert)
    │
    ├── feature-based-structure/
    │   ├── _index.md
    │   ├── technical-vs-domain-grouping.md    (Intermediate)
    │   ├── modular-monolith-basics.md         (Advanced)
    │   ├── bounded-contexts.md                (Advanced)
    │   ├── module-auto-discovery.md           (Expert)
    │   ├── inter-module-communication.md      (Advanced)
    │   ├── module-dependencies.md             (Expert)
    │   ├── feature-flags.md                   (Advanced)
    │   ├── vertical-slice-architecture.md     (Advanced)
    │   ├── shared-kernel.md                   (Expert)
    │   └── module-extractability.md           (Enterprise)
    │
    └── exception-handling/
        ├── _index.md
        ├── exception-handler-configuration.md (Foundation)
        ├── custom-exceptions.md               (Intermediate)
        ├── http-exception-rendering.md        (Intermediate)
        ├── json-error-formatting.md           (Intermediate)
        ├── validation-error-formatting.md     (Intermediate)
        ├── production-vs-debug-display.md     (Intermediate)
        ├── error-tracking-integration.md      (Expert)
        └── error-pages-customization.md       (Intermediate)
```

---

# Domain → Subdomain Mapping

| Domain | Subdomain | Example Knowledge Unit |
|--------|-----------|----------------------|
| Laravel Core Application Engineering | application-architecture | bootstrapping-lifecycle |
| Laravel Core Application Engineering | routing | route-model-binding-implicit |
| Laravel Core Application Engineering | controllers | thin-controller-principles |
| Laravel Core Application Engineering | service-layer | service-orchestration |
| Laravel Core Application Engineering | action-pattern | action-composition |
| Laravel Core Application Engineering | middleware | middleware-ordering-priority |
| Laravel Core Application Engineering | form-requests-validation | custom-validation-rules |
| Laravel Core Application Engineering | dtos | spatie-laravel-data |
| Laravel Core Application Engineering | api-resources | conditional-relationships |
| Laravel Core Application Engineering | blade-view-layer | view-models-presenters |
| Laravel Core Application Engineering | livewire-inertia | stack-selection-guide |
| Laravel Core Application Engineering | feature-based-structure | modular-monolith-basics |
| Laravel Core Application Engineering | exception-handling | json-error-formatting |

---

# Future Growth Considerations

## Adding new Laravel versions

When new Laravel versions introduce API changes (e.g., Laravel 13's Typed Form Requests), add a dedicated leaf node in the relevant subdomain (form-requests-validation/typed-form-requests.md). If the change spans multiple subdomains, create a migration guide at the root (`knowledge/laravel-core-application-engineering/laravel-13-migration.md`).

## Livewire / Inertia subdomain splitting

If Livewire or Inertia content grows beyond ~20 knowledge units each, promote each to its own top-level subdomain (`livewire/` and `inertia/`) under `laravel-core-application-engineering/`. The `stack-selection-guide.md` and `hybrid-approaches.md` files remain shared.

## New frontend stack additions

If a new Laravel frontend stack emerges (e.g., official HTMX support), add it as a sibling to `livewire/` and `inertia/` within the existing subdomain, keeping the stack selection guide as the central decision point.

## Feature-based structure evolution

As modular monolith patterns evolve, new leaf nodes slot under `feature-based-structure/` without restructuring. Topics like "Event Sourcing in Modules" or "Read Model Projections" can be added as new leaves.

## Exception handling expansion

If exception handling grows significantly (e.g., dedicated API error specification compliance), it can be promoted to a sibling of `api-resources/` with dedicated sub-pages.

## Non-breaking additions

New discovery within an existing knowledge unit updates that file. New topics within an existing subdomain add a new leaf file. New capabilities that span multiple subdomains add a cross-reference leaf at the subdomain root (`_index.md`).

## No anticipated restructuring

The current 13-subdomain structure is stable. All known Laravel Core Application Engineering topics fit within these boundaries. No subdomain is expected to be removed or merged in the foreseeable future.
