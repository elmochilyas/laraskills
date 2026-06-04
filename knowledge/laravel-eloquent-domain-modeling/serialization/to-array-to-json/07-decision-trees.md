# Decision Trees: ToArray / ToJson

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Serialization |
| Knowledge Unit | ToArray / ToJson |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Model toArray() vs API Resources | Primary |
| 2 | toArray() override correctness | Architecture |
| 3 | Date serialization strategy | Architecture |
| 4 | jsonSerialize() divergence | Architecture |

---

## Decision 1: Model toArray() vs API Resources

### Context
Model `toArray()` is the simplest serialization path. API Resources provide request-aware, conditional, and wrapping features. The choice depends on the serialization channel and required features.

### Criteria
- Is the serialization for HTTP API responses?
- Does the output need attribute renaming, computed fields, or conditional inclusion?
- Is pagination or wrapping required?
- Is the serialization for non-HTTP channels (queue, broadcast)?
- Are sensitive attributes filtered via `$hidden`?

### Decision Tree
```
Is the serialization for HTTP API responses?
├── YES
│   └── Does the output need renaming, computed fields, conditionals, or wrapping?
│       ├── YES → API Resource (JsonResource)
│       └── NO → Model toArray() is simpler
│           └── Are sensitive attributes properly hidden?
│               ├── YES → Model toArray() is acceptable
│               └── NO → Use Resource with explicit field selection
└── NO (queue, broadcast, CLI, caching, logging)
    └── Use model toArray() or DTO
        └── Is this a multi-channel scenario?
            ├── YES → Consider DTO instead of model toArray()
            └── NO → Model toArray() is appropriate
```

### Rationale
Model `toArray()` is tightly coupled to the model schema — renaming a column breaks the serialization output. API Resources decouple HTTP presentation from the model structure. For non-HTTP channels, model `toArray()` is simpler and appropriate, but DTOs provide stronger contracts for multi-channel scenarios.

### Recommended Default
API Resources for all HTTP endpoints. Model `toArray()` for non-HTTP channels (caching, logging, internal). DTOs for multi-channel or typed boundary scenarios.

### Risks
- Model toArray() for public API: schema changes break consumers silently
- API Resource for internal use: unnecessary complexity
- No $hidden on sensitive columns: data exposure through toArray()
- Appended accessors missing: computed values absent from output
- Lazy-loaded relations in toArray(): N+1 queries

### Related Rules/Skills
- Resource for HTTP (05-rules.md)
- Model toArray() for Non-HTTP (05-rules.md)
- DTO for Multi-Channel (05-rules.md)

---

## Decision 2: toArray() Override Correctness

### Context
Overriding `toArray()` on a model customizes serialization output. If the override doesn't call `parent::toArray()`, relationship serialization is lost. If it does call parent, all `$hidden`/`$appends` rules are respected.

### Criteria
- Does the model have loaded relationships that should appear in output?
- Are there `$hidden` or `$appends` attributes on the model?
- Is the override for renaming, excluding, or computing fields?
- Are custom serialized keys stable across schema changes?

### Decision Tree
```
Does the override need relationships in the output?
├── YES → MUST call parent::toArray() or manually serialize relations
│   └── If calling parent::toArray():
│       ├── Does the parent return unwanted fields?
│       │   ├── YES → array_merge parent + custom array (override only needed fields)
│       │   └── NO → parent::toArray() alone or with additions
│       └── If NOT calling parent::toArray() AND no manual relation serialization:
│           └── BUG — relations missing from output
└── NO → No relationships needed
    └── Return custom array without parent call (simpler)
```
```
Does the override need to exclude sensitive or internal fields?
├── YES → Use $hidden instead; toArray() override bypasses it
│   └── If NOT using $hidden: manually filter in toArray()
│       └── Risk: new sensitive attributes added later are exposed
└── NO → No exclusion concern
```

### Rationale
`parent::toArray()` chains into `attributesToArray()` and `relationsToArray()`, respecting `$hidden`, `$appends`, and date formatting. Bypassing it means maintaining all serialization logic manually. Calling parent and merging custom overrides is the safest pattern — parent handles conventions, override handles custom shape.

### Recommended Default
Always call `parent::toArray()` in overrides and merge custom keys. Only skip the parent call when the serialization is completely custom and no relationships, `$hidden`, or `$appends` are needed.

### Risks
- No parent call: relationships, $hidden, $appends all lost
- Manual relation serialization: N+1 if relations not loaded
- Override without $hidden: sensitive attributes exposed
- Override that renames fields: consumer breakage on rename change
- Parent call with unwanted fields: extra data in output

### Related Rules/Skills
- parent::toArray() Safety (05-rules.md)
- $hidden for Exclusion (05-rules.md)

---

## Decision 3: Date Serialization Strategy

### Context
Laravel serializes dates via `serializeDate()` on the model. Default format is `Y-m-d H:i:s`. Custom formats (ISO 8601, timestamps) can be set globally on a base model or per-model.

### Criteria
- Is a consistent date format needed across all models?
- Do specific models need different date formats?
- Do API consumers expect a specific format (ISO 8601, RFC 3339)?
- Are Carbon serialization methods used in accessors?

### Decision Tree
```
Do all models use the same date format?
├── YES → Override serializeDate() on a base model (single source of truth)
│   └── What format?
│       ├── ISO 8601 → $date->toIso8601String()
│       ├── RFC 3339 → $date->format(DateTimeInterface::RFC3339)
│       ├── Timestamp → $date->timestamp
│       └── Custom → $date->format('Y-m-d\TH:i:s\Z')
└── NO → Override serializeDate() per model or use accessors
    └── Is per-model format manageable?
        ├── YES → serializeDate() override per model
        └── NO → Reconsider uniformity; inconsistent dates confuse consumers
```
```
Are date formats specified in the API contract?
├── YES → Match the contract format in serializeDate()
└── NO → Choose a standard (ISO 8601 recommended) and document it
```

### Rationale
A global `serializeDate()` override on a base model ensures every date attribute follows the same format. This prevents the common bug where some models output `Y-m-d H:i:s` and others output ISO 8601. Per-model overrides are valid when business requirements differ (e.g., audit timestamps in Unix, display dates in ISO).

### Recommended Default
Override `serializeDate()` on a base model to output ISO 8601 (`$date->toIso8601String()`). Use per-model overrides only when a specific model requires a different format for business reasons.

### Risks
- Inconsistent date formats across models: consumer parsing errors
- Default Y-m-d H:i:s format: not ISO 8601 compliant
- serializeDate() not overridden: default format may not match API spec
- Accessor returning Carbon without format: serialized as default format
- Timezone not considered: dates may shift unexpectedly for consumers

### Related Rules/Skills
- serializeDate() on Base Model (05-rules.md)
- ISO 8601 Default (05-rules.md)

---

## Decision 4: jsonSerialize() Divergence

### Context
`jsonSerialize()` implements PHP's `JsonSerializable` interface. By default it calls `toArray()`. Overriding it allows `json_encode` to produce different output than explicit `toArray()` calls, which can create subtle bugs.

### Criteria
- Does `json_encode($model)` need different output than `$model->toArray()`?
- Are there cases where the JSON string representation differs from the array representation?
- Could the divergence surprise other developers?

### Decision Tree
```
Does json_encode($model) need different output than $model->toArray()?
├── YES → Override jsonSerialize()
│   └── Is the divergence intentional and documented?
│       ├── YES → Add comments explaining WHY they differ
│       └── NO → Unnecessary complexity; merge into toArray()
└── NO → Do NOT override jsonSerialize()
    └── Default: jsonSerialize() calls toArray() — consistent behavior
```
```
Is jsonSerialize() overriding to add data that should always be present?
├── YES → Move that data to toArray() instead (single source of truth)
└── NO → jsonSerialize() is safe for type/format additions
```
```
Will jsonSerialize() behavior be tested?
├── YES → Test both json_encode and toArray() outputs
└── NO → Remove the divergence; untested divergence will cause bugs

### Rationale
A divergence between `jsonSerialize()` and `toArray()` means the model serializes differently depending on whether `json_encode()` or `toArray()` is used. This is almost never intentional and creates maintenance debt. If both paths must produce the same output, the default delegation (jsonSerialize → toArray) is correct.

### Recommended Default
Do NOT override `jsonSerialize()` unless there is a specific, documented reason for `json_encode` to differ from `toArray()`. In almost all cases, modifications belong in `toArray()`.

### Risks
- Silent divergence: json_encode and toArray() produce different data
- Untested override: divergence discovered in production
- developer surprise: colleagues call toArray() expecting jsonSerialize behavior
- Serialization debug difficulty: output depends on serialization method

### Related Rules/Skills
- jsonSerialize() Only for Divergence (05-rules.md)
- toArray() as Single Source (05-rules.md)
