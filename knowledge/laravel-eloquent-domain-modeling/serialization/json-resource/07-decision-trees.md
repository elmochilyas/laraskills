# Decision Trees: JSON Resource

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Serialization |
| Knowledge Unit | JSON Resource |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Resource vs model toArray() selection | Primary |
| 2 | Nested resource eager loading safety | Architecture |
| 3 | Resource context awareness | Architecture |

---

## Decision 1: Resource vs Model toArray() Selection

### Context
API Resources (`JsonResource`) and model `toArray()` both produce serialized output. Resources add request-aware, conditional, and wrapping features. Model `toArray()` is simpler but limited.

### Criteria
- Is the serialization for HTTP API responses only?
- Does the output need attribute renaming, computed fields, or conditional inclusion?
- Is pagination or wrapping required?
- Is the serialization for non-HTTP channels (queue, broadcast)?

### Decision Tree
```
Is this serialization for HTTP API responses?
├── YES
│   └── Does the default model toArray() produce exactly the right output?
│       ├── YES → Model toArray() is simpler
│       └── NO (need renaming, computed, conditional, wrapping)
│           └── Use API Resource
└── NO (queue, broadcast, CLI, events)
    └── Use model toArray() or DTO — Resources are HTTP-coupled
```

### Rationale
API Resources are the correct layer for HTTP response transformation. They keep serialization logic out of the model and provide request context. Model `toArray()` is appropriate for non-HTTP channels where request context is irrelevant. Mixing both is fine — Resources for HTTP, model `toArray()` for everything else.

### Recommended Default
API Resources for all HTTP API endpoints. Model `toArray()` only for non-HTTP channels or when the output requires no transformation.

### Risks
- Resource in queue: serializes with HTTP baggage, unexpected behavior
- Model `toArray()` for API without transformation: limited control over output shape
- Resource for simple pass-through: unnecessary abstraction
- No Resource at all: attribute renaming/computed fields handled in controllers

### Related Rules/Skills
- Resource for HTTP (05-rules.md)
- Model toArray() for Non-HTTP (05-rules.md)
- DTO for Multi-Channel (05-rules.md)

---

## Decision 2: Nested Resource Eager Loading Safety

### Context
Resources that nest other resources (`PostResource` containing `CommentResource`) rely on the parent model's relationships being loaded. Unloaded relationships produce silent empty data or N+1.

### Criteria
- Does the resource include nested resource calls?
- Are the nested relationships eager-loaded at the query site?
- Is `whenLoaded()` used to guard nested resources?
- Could the relationship be conditionally loaded?

### Decision Tree
```
Does the resource include nested resource calls?
├── YES
│   └── Are the relationships loaded with with() at the query site?
│       ├── YES → Safe — use whenLoaded() as guard
│       └── NO → MUST add with() to prevent N+1
│           └── Is the relationship always needed?
│               ├── YES → with() at query site
│               └── NO → whenLoaded() + optional with() at query site
└── NO → No nesting concern
```

### Rationale
`PostResource` calling `CommentResource::collection($this->whenLoaded('comments'))` without `Post::with('comments')` at the query site means comments are never loaded and `whenLoaded()` silently returns nothing. The resource code looks correct but the data is always absent. Eager loading at the query site + `whenLoaded()` guard is the required combination.

### Recommended Default
Always eager-load relationships used in nested resources. Always wrap nested resources in `whenLoaded()`. Test that nested data appears when loaded and is absent when not.

### Risks
- Nested resource without eager loading: data always absent (silent)
- Nested resource without `whenLoaded()`: N+1 on serialization
- Deep nesting without eager loading: N+1 at each level
- `whenLoaded()` typo in relation name: data never appears, no error

### Related Rules/Skills
- Eager Load for Nested Resources (05-rules.md)
- whenLoaded for All Relations (05-rules.md)
- Resource Testing (05-rules.md)

---

## Decision 3: Resource Context Awareness

### Context
Resources receive `$request` in `toArray($request)`, enabling context-aware output (admin vs public fields, locale-based content, feature flags). The decision is how much context awareness is appropriate before the resource becomes too complex.

### Criteria
- Are there role-based or permission-based differences in the output?
- Is the output content sensitive to locale, feature flags, or request state?
- Are there multiple distinct output variants (admin vs public)?
- Is the context awareness simple or complex?

### Decision Tree
```
Are there role-based differences in the output?
├── YES
│   └── How many output variants exist?
│       ├── 1-2 (admin vs public) → Single resource with when() conditionals
│       └── 3+ → Separate resource classes per context
└── NO
    └── Single resource without context branching
        └── Use $request only for trivial context (locale, includes)
```

### Rationale
Simple role-based differences (admin sees one extra field) are manageable with `when()` conditionals. Multiple distinct output shapes (completely different field sets) warrant separate resource classes per version or context. A single resource with 10 branches for 5 roles becomes unmaintainable.

### Recommended Default
Single resource with `when(auth()->user()?.isAdmin(), ...)` for simple admin fields. Separate `AdminUserResource`/`UserResource` classes for significantly different output shapes.

### Risks
- Single resource with too many branches: unreadable, untestable
- Too many resource variants: class explosion
- Context logic in resource that belongs in controller: wrong layer
- Missing context check: exposing admin fields to regular users

### Related Rules/Skills
- Context-Aware Resources (05-rules.md)
- Separate Resource Classes (05-rules.md)
- when() for Role-Based Fields (05-rules.md)
