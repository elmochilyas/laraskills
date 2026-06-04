# Decision Trees — Tagged Bindings

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Dependency Injection |
| Knowledge Unit | ku-06: Tagged Bindings |
| Decision Tree Version | 1.0 |

---

## Decision Inventory

| Decision ID | Title | Description | Frequency | Impact |
|---|---|---|---|---|
| D01 | Tagged Bindings vs Explicit Array Injection | Whether to use tagged bindings or explicitly inject a known array of implementations | Architecture decision | Medium |
| D02 | Tag Registration Strategy | Where and how to register tags — per-provider or centralized | Every tagged binding | Medium |
| D03 | Tag Name Convention | What naming convention to use for tag identifiers | Every new tag | Low |

---

## D01: Tagged Bindings vs Explicit Array Injection

### Decision Context
A class needs a collection of implementations. Should you use tagged bindings (dynamic collection) or inject an explicit array of known implementations?

### Criteria
1. **Implementation count stability**: Is the number of implementations fixed or variable?
2. **Registration source**: Do implementations come from different packages/providers?
3. **Order sensitivity**: Does the execution order need to be configurable?
4. **Usage scope**: Is the collection used in one place or multiple?

### Decision Tree
```
Class needs a collection of implementations
├── Is the number of implementations fixed and known at development time?
│   ├── Yes → Is the collection used in only one place?
│   │   ├── Yes → Explicit array injection (simple, predictable)
│   │   └── No → Tagged bindings (allows other providers to contribute)
│   └── No (variable count, plugin architecture) → Tagged bindings
├── Do implementations come from different packages/providers?
│   ├── Yes → Tagged bindings (each provider tags its own implementations)
│   └── No → Is order flexibility needed?
│       ├── Yes → Tagged bindings + documented order convention
│       └── No → Explicit array injection (simpler)
```

### Rationale
Tagged bindings shine when implementations are contributed by different providers or packages. They allow the tag to be an extension point — new implementations are registered by tagging them, without modifying the consumer. For fixed, known-at-compile-time collections used in one place, explicit array injection is simpler and more predictable.

### Default
Explicit array injection for fixed, local collections. Tagged bindings for extensible collections.

### Risks
- Tagging for fixed collections = unnecessary indirection, harder to trace.
- No interface contract for tagged items = type errors at consumption.
- Tag order is registration order — not always predictable.

### Related Rules/Skills
- Skill: Tagged Bindings

---

## D02: Tag Registration Strategy

### Decision Context
You have implementations to tag. Should the tagging happen in the same provider that registers the bindings, or in a centralized tag registry provider?

### Criteria
1. **Source of bindings**: Do the bindings come from different providers?
2. **Tag centrality**: Is this tag used by many consumers?
3. **Consistency**: Should all tagging for a tag be in one place for auditability?

### Decision Tree
```
Tag registration placement
├── Do all tagged bindings come from the same provider?
│   ├── Yes → Tag in the same provider's register() (right next to the binding)
│   └── No → Do the bindings come from different providers/domains?
│       ├── Yes → Each provider tags its own bindings
│       │   └── Also consider: creating a centralized tag registry provider
│       │       ├── Use when: tag needs to be auditable as a single set
│       │       └── Use when: order of tagged items matters and needs centralized control
│       └── No → (not reachable)
```

### Rationale
Tagging in the same provider as the binding keeps related code together. This is the cleanest pattern when a tag is only populated by one provider. When implementations come from multiple providers (e.g., packages contributing to `'report.generators'`), each provider should tag its own implementations. A centralized tag registry can help when order or auditability is critical.

### Default
Tag in the same provider as the binding. Use centralized registry only when multi-provider coordination is needed.

### Risks
- Centralized registry requires each provider to be loaded before tagging — ordering issues.
- Tagging in multiple providers = tag population order determined by provider registration order.
- No tagging at all = `tagged()` returns empty array, no error.

### Related Rules/Skills
- Skill: Tagged Bindings

---

## D03: Tag Name Convention

### Decision Context
You are creating a new tag for grouping implementations. What should the tag name be?

### Criteria
1. **Scope**: Is this tag for application-internal use or package/public use?
2. **Collision risk**: Could another package use the same tag name?
3. **Clarity**: Does the name describe the role or the implementation?

### Decision Tree
```
Tag name creation
├── Is this tag for a package or public consumption?
│   ├── Yes → Use vendor-prefixed name: vendor-package.feature.role
│   │   └── Example: spatie.media.conversions, laravel.report.generators
│   └── No (application-internal) → Use dot-notation describing the role
│       └── Example: report.formatters, payment.gateways, notification.channels
├── Does the name describe the ROLE (what implementations do) or the IMPLEMENTATION (what they are)?
│   ├── Role → Good: 'report.generators', 'payment.gateways'
│   └── Implementation → Bad: 'pdf.report', 'csv.report'
```

### Rationale
Tag names should describe the role that implementations fulfill, not the specific implementations themselves. This allows new implementations to be added under the same tag without confusion. For public packages, prefixing prevents collisions with other packages.

### Default
Role-based dot-notation for application tags. Vendor-prefixed for package tags.

### Risks
- Generic names ('handlers', 'processors') = collision across packages.
- Implementation-specific names ('pdf.report') = confusing when other implementations share the tag.
- No namespace for package tags = conflict with other packages using the same name.

### Related Rules/Skills
- Skill: Tagged Bindings
