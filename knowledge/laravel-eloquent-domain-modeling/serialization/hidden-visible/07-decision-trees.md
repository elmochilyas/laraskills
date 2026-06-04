# Decision Trees: Hidden / Visible

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Serialization |
| Knowledge Unit | Hidden / Visible |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | $hidden vs $visible strategy | Primary |
| 2 | Runtime makeHidden/makeVisible safety | Architecture |
| 3 | Pivot hidden configuration | Architecture |

---

## Decision 1: $hidden vs $visible Strategy

### Context
`$hidden` blacklists specific attributes; `$visible` whitelists. `$visible` takes precedence if both are set. The choice determines whether new columns are automatically exposed (`$hidden`) or automatically hidden (`$visible`).

### Criteria
- Are there sensitive columns that must never leak?
- Is the model part of a public API with a strict contract?
- Are new columns added frequently to this model?
- Does the model have many columns (> 20) with few sensitive ones?

### Decision Tree
```
Are there sensitive columns that must never appear in serialization?
├── YES
│   └── How many columns are sensitive vs total?
│       ├── Few (1-5) → Use $hidden (deny-list for sensitive few)
│       └── Many (50%+) → Use $visible (allow-list, safer)
└── NO
    └── Is there a strict API contract for this model?
        ├── YES → Use $visible (explicit allow-list)
        └── NO → Use $hidden for known sensitive fields, review new columns
```

### Rationale
`$hidden` is the simpler default — hide the few sensitive columns, expose everything else. `$visible` is safer for strict API contracts — new columns are automatically hidden until explicitly added. However, `$visible` can silently omit new columns from API responses, causing confusion. The right choice depends on the security sensitivity and API contract strictness.

### Recommended Default
`$hidden` for most models with a few sensitive columns. `$visible` for public API models with strict contracts. Never set both — `$visible` silently overrides `$hidden`.

### Risks
- `$visible` without testing new columns: new column silently missing from output
- `$hidden` missing a sensitive column: data leak
- Both `$hidden` and `$visible` set: `$hidden` silently ignored, confusion guaranteed
- `$hidden` for relationships: doesn't work — use resource-level controls

### Related Rules/Skills
- Hidden for Sensitive Data (05-rules.md)
- Visible for Strict Contracts (05-rules.md)
- Mutual Exclusion of Hidden/Visible (05-rules.md)

---

## Decision 2: Runtime makeHidden/makeVisible Safety

### Context
`makeHidden()` and `makeVisible()` mutate the model instance. In shared contexts (queues, pipelines), this mutation affects downstream consumers.

### Criteria
- Is the model shared across multiple consumers (queue, pipeline)?
- Is `makeHidden` called before passing to other methods?
- Is the model serialized multiple times in the same request?
- Is immutability important for this code path?

### Decision Tree
```
Is the model instance shared with other consumers after mutation?
├── YES (queue, event, pipeline)
│   └── Clone the model before mutation
│       └── Use fresh() or replicate() before makeHidden/makeVisible
└── NO (single use, serialized once)
    └── Direct makeHidden/makeVisible is safe
```

### Rationale
`makeHidden()` modifies the model's `$hidden` array in place. If the model is then passed to another consumer that calls `toArray()`, the hidden attributes are still affected. Cloning before mutation prevents this. In controller contexts where the model is serialized once, mutation is safe.

### Recommended Default
Clone the model before `makeHidden()`/`makeVisible()` when the model escapes the current scope. Use `tap($model->clone())->makeVisible('field')` pattern.

### Risks
- Shared instance mutation: downstream consumer sees modified hidden/visible state
- `makeHidden` in loop: accumulates hidden attributes across iterations if not reset
- `makeVisible` for sensitive field without auth check: data leak
- Mutated model in test: test pollution across assertions

### Related Rules/Skills
- Clone Before Mutation (05-rules.md)
- Scope-Bound Mutation (05-rules.md)
- API Resource Alternative (05-rules.md)

---

## Decision 3: Pivot Hidden Configuration

### Context
`$pivotHidden` controls serialization of pivot table attributes on `BelongsToMany` relationships. Without it, all pivot columns are exposed when the pivot data is accessed.

### Criteria
- Does the model have `BelongsToMany` relationships?
- Do the pivot tables have extra columns beyond foreign keys?
- Should pivot columns like `created_at`, `assigned_by` be exposed?
- Is `withPivot()` used to load specific pivot columns?

### Decision Tree
```
Does the model have BelongsToMany relationships?
├── YES
│   └── Do the pivot tables have extra columns (beyond FKs)?
│       ├── YES → Define $pivotHidden
│       │   └── Should any pivot columns be hidden from serialization?
│       │       ├── YES → Add to $pivotHidden
│       │       └── NO → Leave empty (all exposed)
│       └── NO → No $pivotHidden needed (only FKs present)
└── NO → No pivot hidden consideration
```

### Rationale
Pivot tables in many-to-many relationships often contain metadata (`created_at`, `assigned_by`, `role_in_team`) that may be sensitive or noisy in serialization output. `$pivotHidden` filters these without affecting the model's own attributes.

### Recommended Default
Always review pivot columns and configure `$pivotHidden` for any `BelongsToMany` relationship. Hide `created_at`/`updated_at` from pivot serialization by default.

### Risks
- Missing `$pivotHidden`: pivot columns like `created_at` leak into every response
- `$pivotHidden` on wrong model/direction: pivot data from one end may still be exposed from the other
- Not using `withPivot()` and relying on `$pivotHidden`: accessing unloaded pivot columns may cause errors

### Related Rules/Skills
- Pivot Hidden Configuration (05-rules.md)
- BelongsToMany Pivot Review (05-rules.md)
- withPivot for Explicit Columns (05-rules.md)
