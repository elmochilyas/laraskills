# Decision Trees: Bounded Context Identification

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Domain Boundaries and Bounded Contexts
- **Knowledge Unit:** Bounded context identification: language, teams, data
- **Knowledge Unit ID:** DBC-01
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Single context vs multiple contexts | Architecture | Initial architectural design |
| 2 | Coarse boundary vs fine boundary | Architecture | Context splitting decision |
| 3 | Language-driven vs database-driven identification | Architecture | Context identification method |

---

## Decision 1: Single context vs multiple contexts

### Context
Not every application needs bounded contexts. A simple CRUD admin panel or a small application with minimal domain complexity can use a single context. Multiple contexts add integration overhead, translation layers, and communication costs. Apply multiple contexts only when the application has meaningful domain complexity where different parts of the business use the same words differently.

### Decision Tree

```
Is the application a simple CRUD system or admin panel with no meaningful business rules?
├── YES → Single context is sufficient
│   No Bounded Context overhead needed — use monolithic structure
└── NO (application has business complexity, domain rules, multiple teams)
    → Consider multiple bounded contexts
    Do different parts of the business use the same words differently?
    ├── YES → Multiple contexts needed — language divergence is the primary signal
    │   "Customer" means buyer in Sales, ticket submitter in Support
    └── NO (same words, same meanings across the business)
        → Single context may still work, but watch for team autonomy needs
        Do multiple teams need to work independently on different parts?
        ├── YES → Consider multiple contexts for team autonomy
        └── NO → Single context is sufficient
```

### Rationale
Bounded contexts solve a specific problem: managing different meanings of the same business concept in different parts of the system. If this language divergence doesn't exist, contexts add complexity without benefit. Start with a single context and extract only when concrete pain emerges. The cost of extracting a context later is predictable and manageable; the cost of premature context boundaries is ongoing integration overhead.

### Recommended Default
Single context for simple applications; multiple contexts only when language divergence is present

### Risks
- Premature context boundaries: integration overhead, translation layers, deployment complexity
- Single context for complex domain: monolithic code, confused models, team contention
- Over-splitting: 20 contexts for a small app — overhead dominates development

### Related Rules
- Identify contexts using language divergence, not database schema (DBC-01/05-rules.md)
- Default to coarse boundaries and split later (DBC-01/05-rules.md)
- Separate contexts when data has distinct lifecycle (DBC-01/05-rules.md)

### Related Skills
- Identify Bounded Contexts Using Language, Teams, and Data Signals (DBC-01/06-skills.md)
- Map Context Relationships (DBC-02/06-skills.md)
- Design Shared Kernel (DBC-03/06-skills.md)

---

## Decision 2: Coarse boundary vs fine boundary

### Decision Tree

```
Are you unsure whether two concepts should be the same context?
├── YES → Keep them together (coarse boundary)
│   Default to broader contexts — splitting is easier than merging
│   Does the concept share the same language across both areas?
│   ├── YES → Definitely same context — same word, same meaning
│   └── NO (language divergence exists)
│       → Separate contexts, but keep coarse if the divergence is minor
│       Document the language distinction and revisit at next architectural review
└── NO (boundary is clear)
    → Is the boundary driven by language divergence or team structure?
    ├── Language divergence → Clear split — this is the right reason
    └── Team structure only → Reconsider — teams can share a context if domain is cohesive
```

### Rationale
Coarse boundaries are the safe default. Splitting a large context into smaller ones later is a localized refactoring. Merging two contexts that shouldn't have been separated requires reconciling divergent models, data, and team conventions — much more expensive. The rule: if in doubt, keep them together. The "3-context" rule of thumb (Identity, Billing, Catalog) works for most applications.

### Recommended Default
3-5 coarse contexts for most applications; split only when concrete language divergence is proven

### Risks
- Too fine: context proliferation, high integration overhead
- Too coarse: a single context that covers multiple divergent languages — confused models
- Team-structure-driven boundaries: artificial splits that don't align with domain

### Related Rules
- Default to coarse boundaries and split later (DBC-01/05-rules.md)
- Identify contexts using language divergence, not database schema (DBC-01/05-rules.md)
- Validate context boundaries with business stakeholders (DBC-01/05-rules.md)

### Related Skills
- Identify Bounded Contexts Using Language, Teams, and Data Signals (DBC-01/06-skills.md)
- Map Context Relationships (DBC-02/06-skills.md)
- Design Anti-Corruption Layer (DBC-04/06-skills.md)

---

## Decision 3: Language-driven vs database-driven identification

### Decision Tree

```
What is your starting point for defining contexts?
├── Existing database tables and schema
│   → This is the WRONG starting point
│   Database structure reflects historical data design decisions, not domain boundaries
│   Switch to language-driven approach:
│   Gather business nouns, list meanings per usage, group by meaning not word
│   Validate with business stakeholders
└── Business language and terminology
    → This is the CORRECT starting point
    Have you validated with business stakeholders that words mean the same thing?
    ├── YES → Proceed with context design
    │   "Customer" in Sales = buyer with discount tier
    │   "Customer" in Support = ticket submitter with SLA
    │   These are different contexts
    └── NO → Validate before coding
        Ask stakeholders: "Does 'Order' mean the same thing here?"
        The answer reveals whether contexts should be separate
```

### Rationale
Database-driven boundaries are the most common mistake in context identification. Existing tables reflect legacy design, team habits, and historical accidents — not domain boundaries. Language divergence is the primary signal: if two parts of the business use "Order" differently, they should be separate contexts. Validate with business stakeholders, not database designers. The database follows the domain, not the other way around.

### Recommended Default
Identify contexts from business language; use database schema only as secondary reference

### Risks
- Database-driven boundaries: contexts align with tables, not business concepts
- No stakeholder validation: technical-only identification misses subtle semantic differences
- Schema-driven splitting: creating a context per database table — 20+ contexts for a small app

### Related Rules
- Identify contexts using language divergence, not database schema (DBC-01/05-rules.md)
- Validate context boundaries with business stakeholders (DBC-01/05-rules.md)
- Use event storming or domain storytelling for context discovery (DBC-01/05-rules.md)

### Related Skills
- Identify Bounded Contexts Using Language, Teams, and Data Signals (DBC-01/06-skills.md)
- Map Context Relationships (DBC-02/06-skills.md)
- Integrate Legacy Systems (DBC-10/06-skills.md)
