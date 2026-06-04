# Decision Trees: Resource Wrapping

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Serialization |
| Knowledge Unit | Resource Wrapping |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Wrapping strategy selection | Primary |
| 2 | Global vs per-resource wrapping | Architecture |
| 3 | Collection wrapping customization | Architecture |

---

## Decision 1: Wrapping Strategy Selection

### Context
By default, single resources are flat and collection resources are wrapped in `data`. Wrapping affects the response structure that API consumers parse. Changing strategies is a breaking change.

### Criteria
- Do frontend consumers expect the `data` key?
- Is the API conforming to a specification (JSON:API, custom)?
- Are there both single and collection endpoints?
- Will the API be versioned?

### Decision Tree
```
Do API consumers depend on the data key for collections?
├── YES → Maintain default behavior (collections wrapped in data)
│   └── Do consumers also expect single resources flat?
│       ├── YES → Default behavior is correct (single=flat, collection=data)
│       └── NO → Set $wrap = 'data' on single resources for consistency
└── NO → Consider withoutWrapping()
    └── Is the API public with existing consumers?
        ├── YES → Version the API; keep legacy wrapping
        └── NO → Choose wrapping strategy early
            └── SPA/modern frontend? → withoutWrapping() globally
            └── JSON:API compliance? → Custom resource-specific wrapping
```
```
Is the API designed for JSON:API compliance?
├── YES → Customize wrapping at resource level per JSON:API spec
│   └── Override wrapping, pagination metadata, and type keys
└── NO → Default Laravel wrapping or withoutWrapping()
```

### Rationale
Default Laravel wrapping (single flat, collection in `data`) suits most projects. `withoutWrapping()` simplifies responses for SPAs. JSON:API requires per-resource wrapping structure. The key rule: decide early and document — changing wrapping post-release breaks every consumer.

### Recommended Default
Use the default behavior (single flat, collection wrapped in `data`) unless consumers explicitly need a different shape. Call `JsonResource::withoutWrapping()` in `AppServiceProvider` only at project inception.

### Risks
- Changing strategy after release: breaks all consumers
- withoutWrapping() on existing API: `data` key disappears from collections
- Inconsistent wrapping: some endpoints flat, others wrapped
- Double wrapping: manual wrapping in toArray() + $wrap property

### Related Rules/Skills
- Wrapping Strategy Selection (05-rules.md)
- Breaking Change Awareness (05-rules.md)

---

## Decision 2: Global vs Per-Resource Wrapping

### Context
`JsonResource::withoutWrapping()` disables wrapping globally. The `$wrap` static property customizes the wrapping key per resource class. The choice determines wrapping consistency across the API.

### Criteria
- Should all resources use the same wrapping behavior?
- Do specific resources need a different wrapping key (e.g., `user` vs `data`)?
- Is the team large enough that per-resource customization risks inconsistency?
- Is the API public with a documented wrapping convention?

### Decision Tree
```
Should all resources share the same wrapping behavior?
├── YES → Global approach
│   └── Wrapped or flat?
│       ├── Flat → JsonResource::withoutWrapping() in AppServiceProvider
│       └── Wrapped → Keep default; set $wrap = 'data' on base resource
└── NO → Per-resource $wrap
    └── Are the wrapping keys documented and consistent per entity?
        ├── YES → Use $wrap per resource (e.g., 'user', 'post')
        └── NO → Standardize first; inconsistent wrapping confuses consumers
```
```
Does a resource have a custom $wrap AND manual wrapping in toArray()?
├── YES → Remove one — double wrapping produces {'user': {'user': {...}}}
└── NO → No double-wrapping risk
```

### Rationale
Global wrapping ensures consistency across the entire API. Per-resource `$wrap` enables named envelopes but risks inconsistency when multiple developers create resources. `withoutWrapping()` nullifies all `$wrap` settings, so use one strategy consistently.

### Recommended Default
Use `JsonResource::withoutWrapping()` globally for flat APIs (SPA-focused). Use default wrapping (single flat, collection in `data`) with no per-resource overrides for most APIs. Only use per-resource `$wrap` for JSON:API or specification-driven designs.

### Risks
- withoutWrapping() nullifies per-resource $wrap: unexpected behavior
- Per-resource $wrap without documentation: consumer confusion
- Resource with both custom toArray() and $wrap: double wrapping
- Runtime $wrap mutation: affects all subsequent requests (static property)

### Related Rules/Skills
- Global Strategy for Consistency (05-rules.md)
- No Runtime $wrap Mutation (05-rules.md)

---

## Decision 3: Collection Wrapping Customization

### Context
Collection resources are hardcoded to wrap in `data` regardless of `$wrap` or `withoutWrapping()`. `withoutWrapping()` only affects single resources. Collections require `ResourceCollection` subclass overrides to change the wrapping key.

### Criteria
- Does the API need collections wrapped in a key other than `data`?
- Is `withoutWrapping()` applied globally but collections still wrap?
- Does the pagination metadata need to appear at a different level?

### Decision Tree
```
Is the collection wrapping key data acceptable?
├── YES → Default ResourceCollection behavior is fine
└── NO → Custom ResourceCollection required
    └── Override toArray() to use a different wrapping key
        └── Example: 'items', 'results', entity-specific key
```
```
Is withoutWrapping() expected to affect collections?
├── YES → Misunderstanding — collections always wrap
│   └── Create a custom ResourceCollection that doesn't wrap
│       └── Override toArray() to return $this->collection directly
└── NO → Correct understanding; collections wrap, singles are flat
```
```
Does pagination metadata share the wrapping key level?
├── YES → Default behavior (data + links/meta at same level)
└── NO → Customize paginationInformation() output structure
```

### Rationale
Collection wrapping in `data` is hardcoded in Laravel's `ResourceCollection` base. `withoutWrapping()` does not affect it. Changing collection wrapping requires a custom `ResourceCollection` subclass that overrides `toArray()` to use a different key or flatten the structure. This is an intentional architectural decision, not a configuration switch.

### Recommended Default
Accept the default `data` wrapping for collections. Only customize when an API specification (like JSON:API) explicitly requires a different envelope structure.

### Risks
- Expecting withoutWrapping() to affect collections: data key persists
- Custom collection toArray() without item mapping: empty response
- Inconsistent collection wrapping: some in data, others in custom keys
- Flattened collection with pagination: metadata location confusion

### Related Rules/Skills
- Collection Wrapping Hardcoded (05-rules.md)
- Custom toArray() for Different Key (05-rules.md)
