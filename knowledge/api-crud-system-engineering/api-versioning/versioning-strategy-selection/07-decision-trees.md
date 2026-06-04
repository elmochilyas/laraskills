# Decision Trees — Versioning Strategy Selection

## Tree 1: Strategy Selection by Context

**Decision Context**: Choosing between URL path, header-based, and media-type versioning based on project characteristics.

**Decision Criteria**:
- Consumer type (public, internal, mobile, browser)
- CDN caching requirements
- Debugging and logging needs
- REST purity requirements
- Number of serialization formats

**Decision Tree**:
```
Is the API public with third-party consumers?
├── YES → Are consumers primarily mobile apps (hardcoded URLs)?
│   ├── YES → URL path versioning — simplest, most debuggable, works everywhere
│   └── NO → Are consumers primarily server-to-server?
│       ├── YES → Header-based or media-type versioning — more REST-pure
│       └── NO → URL path versioning — most compatible across all client types
└── NO → Is the API internal for microservice communication?
    ├── YES → Does the API support multiple serialization formats (JSON, XML)?
    │   ├── YES → Media-type versioning — clean separation of version from format
    │   └── NO → Header-based versioning — clean URLs, no cache fragmentation
    └── NO → Is CDN caching a primary concern?
        ├── YES → URL path versioning — no Vary header needed, no cache fragmentation
        └── NO → URL path versioning (simplest default)
```

**Rationale**: URL path versioning is the most compatible across client types. Header-based is cleaner for internal services. Media-type is best when supporting multiple formats.

**Recommended Default**: URL path versioning for public APIs; header-based for internal microservices; media-type for multi-format APIs.

**Risks**: URL path versioning clutters URLs. Header versioning is invisible in logs. Media-type versioning requires complex content negotiation.

---

## Tree 2: Strategy Migration

**Decision Context**: When and how to migrate from one versioning strategy to another.

**Decision Criteria**:
- Cost of switching (consumer migration, documentation, tooling)
- Current pain with existing strategy
- Timeline and resources available

**Decision Tree**:
```
Is the current strategy causing measurable pain (consumer confusion, support tickets, deployment delays)?
├── YES → Can you add the new strategy alongside the existing one (hybrid approach)?
│   ├── YES → Run both strategies for a deprecation cycle; sunset the old strategy
│   └── NO → Create a new API version with the new strategy; document the migration path
└── NO → Is the team planning a major API overhaul anyway?
    ├── YES → Bundle strategy migration with the overhaul — lower relative cost
    └── NO → Defer migration — current strategy is functional; cost of switching exceeds current pain
```

**Rationale**: Switching versioning strategies is expensive and disruptive. Only migrate when the current strategy is causing verified consumer pain or when a major overhaul makes the migration cost incremental.

**Recommended Default**: Do not migrate unless the current strategy is causing documented consumer issues.

**Risks**: Premature migration wastes resources. Delaying migration past the pain point accumulates consumer support burden.
