# Decision Trees — Directory Organization Strategies

## Tree 1: Layer-First vs Domain-First

**Decision Context**: Choosing the primary directory organization strategy for a Laravel application.

**Decision Criteria**:
- Number of models/domains
- Team size
- Team ownership boundaries
- Application complexity

**Decision Tree**:
```
Is the application small (<50 models) with a small team (1-5 developers)?
├── YES → Layer-first organization (Laravel default) — start simple, consistent with framework
└── NO → Does the application have 20+ distinct business domains?
    ├── YES → Domain-first organization — explicit domain boundaries, scales with team growth
    └── NO → Does the team practice domain-based ownership (separate teams per domain)?
        ├── YES → Domain-first — filesystem enforces team boundaries
        └── NO → Layer-first — sufficient for medium applications with small teams
```

**Rationale**: Layer-first matches Laravel defaults and is simpler for small apps. Domain-first provides explicit boundaries for large apps and teams.

**Recommended Default**: Layer-first for applications <50 models. Domain-first for 20+ domains or 5+ developers.

**Risks**: Premature domain-first creates empty directories and unnecessary namespace complexity. Layer-first at scale creates scattered files across unrelated categories.

---

## Tree 2: Migration Strategy

**Decision Context**: When and how to migrate from layer-first to domain-first organization.

**Decision Criteria**:
- Current application size
- Team growth rate
- Migration disruption tolerance
- Domain boundary clarity

**Decision Tree**:
```
Has the application grown to 20+ domains OR the team to 5+ developers?
├── YES → Is domain ownership clearly defined (which team owns which domain)?
│   ├── YES → Migrate one domain at a time, never in a single commit
│   └── NO → Define domain boundaries first — extract shared infrastructure, then migrate domain-by-domain
└── NO → Is the team experiencing navigation pain (hard to find related files)?
    ├── YES → Create domain subdirectories within layer structure as intermediate step
    └── NO → Defer migration — current strategy is functional
```

**Rationale**: Domain-first migration is disruptive. One domain at a time reduces risk. Team and size thresholds must be met before the migration cost is justified.

**Recommended Default**: Migrate one domain per sprint when 20+ domains or 5+ developers. Defer otherwise.

**Risks**: Migrating without clear domain boundaries creates more confusion than it solves. Migrating all at once creates merge conflicts across the entire codebase.
