# Structure Rationale

The folder structure is organized by **conceptual domain responsibility**, not by Laravel feature taxonomy. Each top-level subdomain represents a distinct concern that a practitioner must master independently. This design serves several purposes:

1. **Non-overlapping boundaries** — Each subdomain has a clear scope with minimal cross-referencing. A practitioner learning "Scopes" knows to look under `query-strategy/`, not across multiple directories.

2. **Natural dependency ordering** — Subdomains flow from foundational (model-design, relationships) through intermediate (attribute-system, query-strategy, lifecycle) to advanced (domain-modeling-patterns, architectural-decisions). This mirrors real learning paths.

3. **Future-proof expansion** — Every subdomain directory can absorb new Laravel features without structural changes. New relationship types go under `relationships/relationship-types/`. New cast types go under `attributes-and-casting/custom-casts/`. New architectural debates go under `architectural-decisions/`.

4. **Consistent depth** — Knowledge Units are always leaf-node files. No subdomain has more than 4 levels of nesting (Domain → Subdomain → Topic → Knowledge Unit). This prevents the organizational complexity from exceeding the cognitive complexity.

5. **Framework evolution tolerance** — As Laravel adopts more PHP 8 attributes (replacing property-based configuration), `model-design/php8-attributes/` can expand without disturbing other sections. As the Query Builder vs Eloquent landscape shifts, `query-strategy/query-builder-vs-eloquent/` absorbs the updates.

6. **Expert reference friendly** — Experienced developers can navigate directly to the subdomain they need (e.g., `domain-modeling-patterns/state-machines/`) without traversing unrelated material.

---

# Proposed ECC Folder Tree

```
knowledge/
└── laravel-eloquent-domain-modeling/
    ├── model-design/
    │   ├── model-fundamentals/
    │   │   ├── base-model-class.md
    │   │   ├── model-conventions.md
    │   │   └── model-configuration-properties.md
    │   ├── php8-attributes/
    │   │   ├── attribute-registration.md
    │   │   └── strict-mode-configuration.md
    │   └── model-organization/
    │       ├── trait-decomposition.md
    │       └── directory-structure.md
    │
    ├── relationships/
    │   ├── relationship-types/
    │   │   ├── has-one.md
    │   │   ├── has-many.md
    │   │   ├── belongs-to.md
    │   │   ├── belongs-to-many.md
    │   │   ├── has-one-through.md
    │   │   ├── has-many-through.md
    │   │   ├── fluent-through-relationships.md
    │   │   ├── polymorphic-morph-one-morph-many.md
    │   │   ├── polymorphic-morph-to-many.md
    │   │   └── has-one-of-many.md
    │   ├── pivot-models/
    │   │   ├── pivot-table-conventions.md
    │   │   ├── custom-pivot-models.md
    │   │   ├── morph-pivot.md
    │   │   ├── pivot-attributes.md
    │   │   └── pivot-events.md
    │   ├── eager-loading/
    │   │   ├── eager-loading-fundamentals.md
    │   │   ├── constrained-eager-loading.md
    │   │   ├── lazy-eager-loading.md
    │   │   └── dollar-with-blast-radius.md
    │   ├── aggregate-methods/
    │   │   ├── with-count.md
    │   │   ├── with-sum-avg-min-max.md
    │   │   └── with-exists.md
    │   └── relationship-patterns/
    │       ├── where-belongs-to.md
    │       ├── default-models.md
    │       ├── scoped-relationships.md
    │       ├── inverse-relations.md
    │       ├── chaperone.md
    │       └── relationship-touch.md
    │
    ├── attributes-and-casting/
    │   ├── accessors-mutators/
    │   │   ├── accessor-patterns.md
    │   │   ├── mutator-patterns.md
    │   │   ├── multi-attribute-mutators.md
    │   │   └── attribute-caching.md
    │   ├── built-in-casts/
    │   │   ├── primitive-casts.md
    │   │   ├── date-time-casts.md
    │   │   ├── encrypted-casts.md
    │   │   ├── enum-casts.md
    │   │   ├── hashed-cast.md
    │   │   └── collection-casts.md
    │   ├── custom-casts/
    │   │   ├── casts-attributes-interface.md
    │   │   ├── casts-inbound-interface.md
    │   │   ├── castable-interface.md
    │   │   ├── cast-parameters.md
    │   │   ├── serializes-castable-attributes.md
    │   │   └── runtime-casting.md
    │   └── value-objects/
    │       ├── value-object-fundamentals.md
    │       ├── value-object-casting.md
    │       ├── immutability-patterns.md
    │       └── money-email-address.md
    │
    ├── query-strategy/
    │   ├── eloquent-builder/
    │   │   ├── builder-fundamentals.md
    │   │   ├── conditional-clauses.md
    │   │   ├── subqueries.md
    │   │   └── higher-order-messages.md
    │   ├── query-builder-vs-eloquent/
    │   │   ├── decision-framework.md
    │   │   ├── performance-tradeoffs.md
    │   │   ├── hybrid-strategies.md
    │   │   └── to-base-pattern.md
    │   ├── scopes/
    │   │   ├── local-scopes.md
    │   │   ├── dynamic-scopes.md
    │   │   ├── global-scopes.md
    │   │   └── global-scope-suppression.md
    │   └── custom-builders/
    │       ├── custom-builder-pattern.md
    │       └── domain-specific-query-methods.md
    │
    ├── model-lifecycle/
    │   ├── events/
    │   │   ├── event-catalog.md
    │   │   ├── event-dispatch-order.md
    │   │   ├── event-propagation.md
    │   │   ├── event-control-quiet-operations.md
    │   │   └── manual-event-firing.md
    │   ├── observers/
    │   │   ├── observer-pattern.md
    │   │   ├── observer-registration.md
    │   │   └── observer-anti-patterns.md
    │   ├── boot-traits/
    │   │   ├── trait-boot-convention.md
    │   │   ├── trait-init-convention.md
    │   │   └── trait-boot-ordering.md
    │   └── model-broadcasting/
    │       ├── broadcast-events-trait.md
    │       └── commit-strategies.md
    │
    ├── factories-and-seeders/
    │   ├── factory-fundamentals/
    │   │   ├── factory-definition.md
    │   │   ├── factory-states.md
    │   │   ├── factory-sequences.md
    │   │   └── factory-callbacks.md
    │   ├── factory-relationships/
    │   │   ├── has-many-factories.md
    │   │   ├── belongs-to-factories.md
    │   │   ├── belongs-to-many-factories.md
    │   │   ├── recycle-pattern.md
    │   │   └── circular-dependency-resolution.md
    │   └── seeders/
    │       ├── seeder-organization.md
    │       ├── seeding-strategies.md
    │       └── environment-specific-seeding.md
    │
    ├── serialization/
    │   ├── array-json-conversion/
    │   │   ├── to-array-to-json.md
    │   │   ├── hidden-visible.md
    │   │   └── appends.md
    │   ├── api-resources/
    │   │   ├── json-resource.md
    │   │   ├── resource-collection.md
    │   │   ├── conditional-attributes.md
    │   │   ├── pagination.md
    │   │   └── resource-wrapping.md
    │   └── dtos/
    │       ├── dto-patterns.md
    │       ├── spatie-laravel-data.md
    │       └── resources-vs-dtos.md
    │
    ├── domain-modeling-patterns/
    │   ├── active-record-as-domain/
    │   │   ├── active-record-domain-layer.md
    │   │   ├── domain-methods-on-models.md
    │   │   └── aggregate-boundaries.md
    │   ├── state-machines/
    │   │   ├── state-pattern-fundamentals.md
    │   │   ├── spatie-model-states.md
    │   │   ├── custom-state-machine.md
    │   │   └── transition-guards.md
    │   ├── domain-events/
    │   │   ├── domain-event-vs-model-event.md
    │   │   ├── dispatching-domain-events.md
    │   │   └── event-projections.md
    │   └── tactical-ddd/
    │       ├── bounded-contexts.md
    │       ├── aggregate-roots.md
    │       ├── domain-repositories.md
    │       └── domain-services.md
    │
    ├── soft-deletes-and-pruning/
    │   ├── soft-deletes/
    │   │   ├── soft-deletes-trait.md
    │   │   ├── querying-soft-deletes.md
    │   │   ├── restoring.md
    │   │   └── force-deleting.md
    │   └── pruning/
    │       ├── prunable-trait.md
    │       ├── mass-prunable.md
    │       └── prune-command.md
    │
    ├── performance-and-integrity/
    │   ├── n-plus-one/
    │   │   ├── detection.md
    │   │   ├── prevention-strategies.md
    │   │   └── lazy-loading-violations.md
    │   ├── chunking-and-streaming/
    │   │   ├── chunk-chunk-by-id.md
    │   │   ├── lazy-lazy-by-id.md
    │   │   └── cursor.md
    │   ├── data-integrity/
    │   │   ├── database-constraints.md
    │   │   ├── unique-enforcement.md
    │   │   ├── first-or-create-vs-create-or-first.md
    │   │   ├── upsert-patterns.md
    │   │   └── concurrency-handling.md
    │   └── query-optimization/
    │       ├── select-constraints.md
    │       ├── index-aware-queries.md
    │       └── subquery-optimization.md
    │
    └── architectural-decisions/
        ├── fat-models-vs-actions/
        │   ├── when-to-use-actions.md
        │   ├── when-models-are-enough.md
        │   └── action-class-patterns.md
        ├── repository-debate/
        │   ├── when-repositories-help.md
        │   ├── when-repositories-hurt.md
        │   └── query-object-alternative.md
        ├── cqrs-lite/
        │   ├── read-model-separation.md
        │   └── write-model-separation.md
        └── hexagonal-architecture/
            ├── ports-and-adapters.md
            ├── eloquent-as-adapter.md
            └── framework-decoupling.md
```

---

# Domain → Subdomain Mapping

| Domain | Subdomain Directory | Core Topics |
|---|---|---|
| Laravel Eloquent & Domain Modeling | `model-design/` | Model class, conventions, configuration, PHP 8 attributes, organization, trait decomposition |
| Laravel Eloquent & Domain Modeling | `relationships/` | All 11 relationship types, pivot models, eager loading, aggregates, relationship patterns |
| Laravel Eloquent & Domain Modeling | `attributes-and-casting/` | Accessors, mutators, built-in casts, custom casts, value objects |
| Laravel Eloquent & Domain Modeling | `query-strategy/` | Eloquent Builder, Query Builder vs Eloquent, scopes, custom builders |
| Laravel Eloquent & Domain Modeling | `model-lifecycle/` | Events, observers, boot traits, model broadcasting |
| Laravel Eloquent & Domain Modeling | `factories-and-seeders/` | Factory fundamentals, relationship factories, seeders |
| Laravel Eloquent & Domain Modeling | `serialization/` | Array/JSON conversion, API Resources, DTOs |
| Laravel Eloquent & Domain Modeling | `domain-modeling-patterns/` | Active Record as domain, state machines, domain events, tactical DDD |
| Laravel Eloquent & Domain Modeling | `soft-deletes-and-pruning/` | SoftDeletes trait, querying, restoring, Prunable |
| Laravel Eloquent & Domain Modeling | `performance-and-integrity/` | N+1, chunking/streaming, data integrity, query optimization |
| Laravel Eloquent & Domain Modeling | `architectural-decisions/` | Fat models vs actions, repository debate, CQRS-lite, hexagonal |

---

# Future Growth Considerations

## Adding New Laravel Versions

Each new Laravel version may introduce new Eloquent features (e.g., new relationship types, new cast types, new lifecycle methods). These can be added as new Knowledge Unit files in the appropriate existing subdirectory without restructuring:

- New relationship type → `relationships/relationship-types/{new-type}.md`
- New cast type → `attributes-and-casting/built-in-casts/{new-cast}.md`
- New model attribute → `model-design/php8-attributes/{new-attribute}.md`
- New lifecycle method → `model-lifecycle/events/event-catalog.md` (append update)

## Emerging Patterns

As the community adopts new patterns, they can be added:

- New domain pattern → `domain-modeling-patterns/{new-pattern}/`
- New architectural approach → `architectural-decisions/{new-approach}/`
- New data integrity pattern → `performance-and-integrity/data-integrity/{new-pattern}.md`

## Avoiding Single-File Folders

All current directories contain at least 2 Knowledge Units. New topics should follow the same rule: a new subdirectory should contain at least 2 files, or be placed into an existing directory as a single file if it is a minor variation of an existing topic.

## Cross-Domain References

Some topics naturally bridge domains. When a Knowledge Unit references another domain (e.g., database indexing in `performance-and-integrity/query-optimization/` references Data & Storage Systems), include a cross-reference note in the Knowledge Unit file rather than duplicating content.

## Expansion Thresholds

If a subdirectory exceeds 10 files, consider splitting:
- `relationships/relationship-types/` at 10+ types → split into `relationships/standard/` and `relationships/polymorphic/`
- `model-lifecycle/events/` at 10+ files → split into `model-lifecycle/create-events/` and `model-lifecycle/delete-events/`
- `architectural-decisions/` at 8+ debates → split by scope (internal vs external architecture)
