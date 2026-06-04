# Decision Trees: Module Boundary Identification

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Modular Monolith Design
- **Knowledge Unit:** Module boundary identification: bounded context heuristics
- **Knowledge Unit ID:** MMD-02
- **Difficulty Level:** Intermediate

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Use language divergence vs technical boundaries to identify modules | Architecture | Module design |
| 2 | Start broad and split later vs fine-grained from the start | Architecture | Initial module design |
| 3 | Business domain names vs technical layer names for modules | Naming | Module creation |

---

## Decision 1: Use language divergence vs technical boundaries to identify modules

### Context
The primary heuristic for module boundaries is language divergence — when the same business term means different things in different contexts. Technical boundaries (by layer: API, Admin, Database) don't align with business ownership and create cross-cutting modules that contain unrelated business logic.

### Decision Tree

```
Do business terms mean different things in different contexts?
├── YES → Language divergence exists — clear boundary signal
│   Have domain experts validated the divergence?
│   ├── YES → Confirmed boundary — split at this divergence
│   └── NO → Validate with domain experts before committing
└── NO → No clear language divergence
    Does change-frequency analysis show independent change patterns?
    ├── YES → Boundary exists despite shared terminology — split
    └── NO → Single-domain application — keep as one module
```

### Rationale
Language divergence is the most reliable signal because it reflects genuine domain distinctions. When "Customer" means one thing in Billing and another in Support, those are separate bounded contexts. Change-frequency analysis validates what language divergence suggests: concepts that change for different reasons belong in different modules.

### Recommended Default
Use language divergence as primary signal, validate with domain experts

### Risks
- Technical boundaries (Admin, API) create modules with unrelated logic
- Database-driven boundaries reflect historical design, not business domains
- Language divergence without domain validation may be developer assumption

### Related Rules
- Language Divergence as Primary Signal (MMD-02/05-rules.md)
- Business Domain Boundaries, Not Technical (MMD-02/05-rules.md)
- Avoid Database-Driven Boundaries (MMD-02/05-rules.md)
- Validate with Change-Frequency Analysis (MMD-02/05-rules.md)

### Related Skills
- Identify Module Boundaries Using Bounded Context Heuristics (MMD-02/06-skills.md)
- Identify Bounded Contexts (DBC-01/06-skills.md)
- Map Context Boundaries (DBC-02/06-skills.md)

---

## Decision 2: Start broad and split later vs fine-grained from the start

### Context
Module boundaries are easier to split than merge. Starting with 3-5 broad modules and splitting as divergence emerges avoids the overhead of excessive inter-module coordination. Premature fine-grained boundaries create communication overhead and frequently require costly merges when wrong.

### Decision Tree

```
Is the team size 3-8 developers?
├── YES
│   Is the domain well-understood with validated bounded contexts from event storming?
│   ├── YES → May justify 5-8 modules if boundaries are clear
│   └── NO → Start with 3-5 broad modules; split later
└── NO (larger team)
    Can each module be owned by a distinct sub-team?
    ├── YES → More modules justified (one per team) but start broader and split
    └── NO → Default to fewer modules regardless of team size
```

### Rationale
Merging modules requires data migration, code reorganization, and contract resolution — significantly more work than splitting. Broad initial boundaries give the team time to understand where real divergence emerges. Event storming with validated boundaries is the only justification for starting fine-grained.

### Recommended Default
Start with 3-5 broad modules, split as divergence emerges

### Risks
- Too fine-grained: excessive inter-module coordination overhead
- Too fine-grained: frequent costly merges when boundaries are wrong
- Too broad: module becomes a god container with unrelated concepts

### Related Rules
- Start Broad, Split Later (MMD-02/05-rules.md)
- Limit Module Count by Team Size (MMD-02/05-rules.md)
- Event Storming for Discovery (MMD-02/05-rules.md)

### Related Skills
- Identify Module Boundaries Using Bounded Context Heuristics (MMD-02/06-skills.md)
- Implement Module Internal Structure (MMD-03/06-skills.md)

---

## Decision 3: Business domain names vs technical layer names for modules

### Context
Module names should reflect business domains (Billing, Catalog, Inventory), not technical layers (API, Admin, Frontend). Technical-layer modules collect unrelated business logic from across the application. An "Admin" module would contain billing admin, catalog admin, and user admin — defeating domain-driven modularity.

### Decision Tree

```
Does the module name describe a business capability?
├── YES (e.g., Billing, Catalog, Inventory)
│   Is the name understandable by domain experts (not just developers)?
│   ├── YES → Good name — keep
│   └── NO → Rename to ubiquitous language term
└── NO (e.g., API, Admin, Database)
    Can the module be reorganized by business domain?
    ├── YES → Split into domain-named modules
    └── NO → Technical boundary is a design smell — document the exception
```

### Rationale
Domain experts should recognize module names. Technical-layer names reveal developer-centric thinking and produce modules that cross-cut business domains. An "Admin" module is not a domain — it's a user role that interacts with multiple domains.

### Recommended Default
Business domain names (Billing, Catalog, Inventory)

### Risks
- Technical names create unrelated-domain modules that cannot be independently owned
- Renaming is costly if done after modules have dependencies
- Ubiquitous language must be shared between developers and domain experts

### Related Rules
- Business Domain Boundaries, Not Technical (MMD-02/05-rules.md)
- Language Divergence as Primary Signal (MMD-02/05-rules.md)
- Document Boundary Rationale in ADRs (MMD-02/05-rules.md)
- Event Storming for Discovery (MMD-02/05-rules.md)

### Related Skills
- Identify Module Boundaries Using Bounded Context Heuristics (MMD-02/06-skills.md)
- Identify Bounded Contexts (DBC-01/06-skills.md)
- Map Context Boundaries (DBC-02/06-skills.md)
