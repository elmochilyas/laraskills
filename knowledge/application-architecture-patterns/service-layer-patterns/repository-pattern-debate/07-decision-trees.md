# Decision Trees: Repository Pattern Debate

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Repository pattern debate: when it adds value vs. overhead
- **Knowledge Unit ID:** SLP-14
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Repository vs direct Eloquent | Architecture | Data access strategy |
| 2 | Feature-oriented repo vs generic CRUD repo | Architecture | Repository design |
| 3 | BaseRepository vs standalone per-entity repos | Architecture | Repository structure |

---

## Decision 1: Repository vs direct Eloquent

### Context
The repository pattern is the most debated architectural topic in Laravel. Proponents cite testability and centralized queries; critics cite ceremony and YAGNI violations. The decision depends on query complexity, data source multiplicity, and architectural requirements.

### Decision Tree

```
Does the service need data from multiple sources (Eloquent + external API)?
├── YES → Use repository to abstract data source
│   `OrderRepository::findFromAllSources($id)` unifies Eloquent + API
└── NO (single data source — Eloquent only)
    → Is there complex query logic duplicated across multiple services?
    ├── YES → Use repository to centralize query logic
    │   Repository methods like `findOverdueInvoices()` DRY up services
    └── NO (simple CRUD, single source, no query duplication)
        → Is this a Clean Architecture project?
        ├── YES → Use repository (port-adapter boundary required by convention)
        └── NO → Use Eloquent directly (no repository needed)
            Can you justify "swap the database" as the primary reason?
            ├── YES → Skip repository — this justification rarely materializes
            └── NO → Eloquent direct access is correct
```

### Rationale
Repositories add value when they solve real problems: multi-source data abstraction, complex query centralization, or architectural boundary requirements. Simple CRUD with Eloquent direct access is faster to write and maintain. The "swap the database" justification is almost never realized — Eloquent semantics permeate the application regardless of a repository layer.

### Recommended Default
Eloquent direct access for simple CRUD; repository for multi-source or complex queries

### Risks
- Premature repository: ceremony without value, developer friction
- Repository drift: created but not used — services call Eloquent directly
- Repository leak: returning Eloquent types (Builder, Paginator) defeats abstraction

### Related Rules
- Use Feature-Oriented Repositories, Not Generic CRUD (SLP-14/05-rules.md)
- If "Swap The Database" Is Primary Justification, Skip The Repository (SLP-14/05-rules.md)
- Repository Should Not Leak Eloquent Types (SLP-14/05-rules.md)

### Related Skills
- Decide When to Use Repository Pattern (SLP-14/06-skills.md)
- Design Feature-Oriented Repositories (SLP-15/06-skills.md)
- Design Query Objects (SLP-16/06-skills.md)

---

## Decision 2: Feature-oriented repo vs generic CRUD repo

### Context
If you decide to use repositories, the next decision is what methods they expose. Generic CRUD repositories (`find()`, `all()`, `create()`, `update()`, `delete()`) mirror Eloquent one-to-one and add no business value. Feature-oriented repositories (`findOverdueInvoices()`, `getTopCustomersByRevenue()`) encapsulate meaningful business queries and justify their existence.

### Decision Tree

```
Does the repository method encapsulate a business-specific query?
├── YES → Feature-oriented — this is the right approach
│   Name method after the business purpose: `findOverdueInvoices()`
│   Return type matches the query: Money for revenue, Collection for entities
└── NO (method mirrors Eloquent: find, all, create, update, delete)
    → Does the method provide any abstraction beyond Eloquent?
    ├── YES (different return type, additional logic, caching)
    │   → Acceptable if value is documented — but prefer feature-oriented naming
    └── NO (exact mirror of Eloquent)
        → Remove the method — it adds ceremony without value
        Consumers should call Eloquent directly
```

### Rationale
Generic CRUD repositories are the most common repository anti-pattern in Laravel. They wrap `User::find($id)` with `$userRepository->find($id)` — the same operation with more indirection. Feature-oriented methods like `findOverdueInvoices()` centralize actual query logic (WHERE clauses, joins, aggregations) and represent real business concepts. Each method should exist because a specific use case needs it.

### Recommended Default
Feature-oriented methods only; no generic CRUD methods

### Risks
- Generic CRUD repository: ceremony without value, team questions the pattern
- Repository + Eloquent duplicate logic: scopes in model and methods in repo define same queries
- Repository returning models for all methods: even aggregation queries return model collections

### Related Rules
- Use Feature-Oriented Repositories, Not Generic CRUD (SLP-14/05-rules.md)
- Name Methods After Business Queries, Not Data Operations (SLP-15/05-rules.md)
- Return The Right Type Per Method (SLP-15/05-rules.md)

### Related Skills
- Create Feature-Oriented Repository Methods (SLP-15/06-skills.md)
- Design Query Objects (SLP-16/06-skills.md)
- Test Service Layer (SLP-17/06-skills.md)

---

## Decision 3: BaseRepository vs standalone per-entity repos

### Context
Some frameworks encourage a `BaseRepository` abstract class with shared CRUD methods that every entity repository extends. This recreates the generic repository problem at the inheritance level. Standalone repositories with domain-specific methods are preferred. Each repository should stand alone without inherited CRUD.

### Decision Tree

```
Do you currently have or plan a BaseRepository abstract class?
├── YES → Do NOT create it
│   Do you have shared query logic across multiple repositories?
│   ├── YES → Use a trait or service class instead of inheritance
│   │   Trait `ScopesByTenant` or service `FilterService` composes better
│   └── NO → Each repository stands alone with its own methods
│       No shared logic needed — don't force it
└── NO (standalone per-entity repos)
    → This is correct — maintain standalone repositories
    Does each repository have methods specific to its domain?
    ├── YES → Good — keep domain-specific focus
    └── NO → If a repository only has inherited CRUD, it should not exist
```

### Rationale
`BaseRepository` with shared CRUD recreates the exact problem of generic repositories but at the inheritance level. Developers inherit `find()`, `all()`, `create()` without thinking about whether those methods make sense for their entity. Shared query logic (like tenant scoping) should be composed via traits or injected services, not inherited. Inheritance creates coupling that makes repositories harder to change independently.

### Recommended Default
Standalone per-entity repositories with no BaseRepository inheritance

### Risks
- BaseRepository coupling: changing base class affects all repositories
- Inherited methods that don't apply: `softDelete()` on a repository for entities without soft deletes
- Testing overhead: testing base class methods through every subclass

### Related Rules
- Skip The BaseRepository (SLP-14/05-rules.md)
- Avoid Abandoned Repositories (SLP-14/05-rules.md)
- Repository Should Not Leak Eloquent Types (SLP-14/05-rules.md)

### Related Skills
- Create Feature-Oriented Repository Methods (SLP-15/06-skills.md)
- Test Repository Methods With Integration Tests (SLP-14/06-skills.md)
- Apply Domain-Driven Design Boundaries (DBC-01/06-skills.md)
