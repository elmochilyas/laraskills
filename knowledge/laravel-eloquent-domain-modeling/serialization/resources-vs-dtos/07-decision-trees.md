# Decision Trees: Resources vs DTOs

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Serialization |
| Knowledge Unit | Resources vs DTOs |
| Decision Tree Version | 1.0 |

## Decision Inventory

| # | Decision | Tree |
|---|---|---|
| 1 | Serialization approach selection | Primary |
| 2 | Resource queue safety | Architecture |
| 3 | Layering enforcement strategy | Architecture |

---

## Decision 1: Serialization Approach Selection

### Context
API Resources (HTTP-aware, request-context-aware) and DTOs (channel-agnostic, typed, immutable) serve different serialization needs. They can be used exclusively or together in a layered architecture. The choice determines how data crosses application boundaries.

### Criteria
- How many channels consume the serialized data (API only vs multiple)?
- Is strict typing and immutability required at boundaries?
- Does the serialization need HTTP-specific features (pagination, wrapping, conditional attributes)?
- Is the application using DDD or Hexagonal Architecture?
- Is the team size and complexity justification aligned?

### Decision Tree
```
Does the data need to serialize for multiple channels (API + queue + events + CLI)?
├── NO (HTTP-only)
│   └── Is the serialization simple shape transformation?
│       ├── YES → API Resources (simple, request-aware, built-in features)
│       └── NO (complex reshaping, computed fields)
│           └── API Resources (conditional attributes, pagination, wrapping)
└── YES (multi-channel)
    └── Does the application use DDD/Hexagonal Architecture?
        ├── YES → Both: DTOs at domain boundaries, Resources at HTTP boundary
        └── NO → DTOs everywhere (typed, immutable, channel-agnostic)
```
```
Does the team handle complexity well?
├── YES → Consider both (DTO + Resource) for layered architecture
└── NO → Single approach is safer
    └── Multi-channel → DTOs
    └── Single-channel → API Resources
```

### Rationale
API Resources excel at HTTP presentation — they have built-in pagination, wrapping, conditional attributes, and request awareness. DTOs excel at typed boundaries — they enforce contracts across channels and prevent Eloquent leakage. The layered approach (DTO → Resource) maximizes both but adds complexity. Choose based on channel count and architectural rigor.

### Recommended Default
Single-channel CRUD: API Resources. Multi-channel: DTOs. Enterprise/DDD: DTOs + Resources (services return DTOs, controllers wrap in Resources).

### Risks
- Resources in queue: HTTP baggage in non-HTTP context
- DTOs for simple CRUD: over-engineering, unnecessary indirection
- No DTOs in multi-channel: serialization contract duplicated per channel
- Layered without enforcement: DTO-to-Resource mapping bypassed
- Mixing patterns per endpoint: inconsistent, confusing architecture

### Related Rules/Skills
- Resource for HTTP (05-rules.md)
- DTO for Multi-Channel (05-rules.md)
- DTO + Resource Layered (05-rules.md)

---

## Decision 2: Resource Queue Safety

### Context
Serializing a `JsonResource` to a queue job carries HTTP context (request, headers, URL) and serializes the full Eloquent model, not just the resource output. This is almost always wrong.

### Criteria
- Is a `JsonResource` being passed to a queue job?
- Is the job payload serialized to the queue driver (database, Redis, SQS)?
- Could the data be represented as a DTO or plain array instead?

### Decision Tree
```
Is a JsonResource being passed to a queue job?
├── YES → THIS IS AN ANTI-PATTERN
│   └── Replace with one of:
│       ├── DTO → Represents only the needed data, typed, no HTTP context
│       ├── Model ID → Job loads model from DB (if freshness matters)
│       └── Plain array → Simple data without structure
└── NO → Safe
    └── Are Eloquent models being passed to jobs instead?
        ├── YES → Acceptable but ensure only necessary relations are loaded
        └── NO → No serialization concern
```

### Rationale
`JsonResource` implements `Serializable` but carries the `$request` object and wraps the full model. Queuing a Resource means serializing HTTP context (pointless in a queue) and the full model graph (overweight). DTOs or model IDs are cleaner, smaller, and context-appropriate for queue payloads.

### Recommended Default
Never pass a `JsonResource` to a queue job. Use DTOs for rich data contracts or model IDs for lazy loading at job execution time.

### Risks
- Queuing Resource with request: serializes large, irrelevant HTTP context
- Queuing Resource with unloaded relations: lazy loading N+1 at serialization
- Model serialization in queue: relation graph serialized unnecessarily
- Resource serialization error in queue: job fails, retries, fills logs

### Related Rules/Skills
- No Resources in Queue (05-rules.md)
- DTO for Queue (05-rules.md)
- Model ID for Job (05-rules.md)

---

## Decision 3: Layering Enforcement Strategy

### Context
When using both DTOs and Resources, the layering must be enforced: services/actions return DTOs, controllers wrap DTOs in Resources. Without enforcement, DTOs are bypassed and Resources receive Eloquent models directly, defeating the purpose.

### Criteria
- Are services/actions returning DTOs or Eloquent models?
- Do controllers receive DTOs or models from services?
- Is there a convention or rule preventing model leakage?
- Are Resources type-hinted against DTOs or models?

### Decision Tree
```
Do services return DTOs or Eloquent models?
├── DTOs → Correct — services return typed contracts
│   └── Do controllers wrap DTOs in Resources?
│       ├── YES → Full layering enforced (DTO → Resource)
│       └── NO → Controllers return DTOs directly
│           └── Is HTTP-specific metadata needed?
│               ├── YES → Add Resource wrapping
│               └── NO → DTOs as response is acceptable (simple APIs)
└── Eloquent models → Leaking domain to boundary
    └── Refactor: services should return DTOs
        └── Is the serialization channel HTTP-only?
            ├── YES → Resources wrapping models is simpler fallback
            └── NO → DTOs are non-negotiable for multi-channel
```
```
Is there a lint/static analysis rule preventing model return from services?
├── YES → Layering is protected
└── NO → Consider adding one or documenting the convention
```

### Rationale
Layering enforcement prevents domain models from leaking to the HTTP boundary. When services return DTOs, the HTTP layer is decoupled from the domain. Resources wrapping DTOs is the final transformation step, not the serialization source. Without enforcement, a refactor that changes the model structure breaks the API contract.

### Recommended Default
Service layer returns DTOs. Controllers wrap DTOs in Resources for HTTP response. Add a project convention (documented or lint-enforced) that services never return Eloquent models.

### Risks
- Service returns model: controller wraps in Resource, but domain leaks
- Controller bypasses service: directly uses model in Resource
- DTO mapped incorrectly: field mismatch between DTO and Resource
- Over-engineering: DTO layer added but services still return models
- No enforcement: new developers bypass DTOs, eroding the architecture

### Related Rules/Skills
- Service Returns DTO (05-rules.md)
- Controller Wraps DTO in Resource (05-rules.md)
- Convention Enforcement (05-rules.md)
