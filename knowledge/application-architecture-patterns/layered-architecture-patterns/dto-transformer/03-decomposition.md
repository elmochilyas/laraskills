# Data Transfer Objects and Transformers — Decomposition

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-14-dto-transformer
- **Last Updated:** 2026-06-04

---

## Topic Overview
DTOs as immutable data carriers between architectural layers and Transformers as presentation formatters that decouple internal object models from external API contracts.

---

## Decomposition Strategy
The topic splits by (1) DTO definition — immutability, typed properties, named constructors, readonly classes; (2) DTO types — input DTOs (from HTTP/CLI) vs output DTOs (to response/serialization); (3) Transformers — how they select, rename, and reshape data for each consumer; (4) DTO vs VO distinction — DTOs cross layers, VOs model domain concepts. This avoids overlapping with Value Object topics by clearly distinguishing the purpose (data transfer vs domain modeling).

---

## Proposed Folder Structure
```
02-layered-architecture-patterns/LAP-14-dto-transformer/
├── 02-knowledge-unit.md
├── 03-decomposition.md
├── 04-standardized-knowledge.md
├── 05-rules.md
├── 06-skills.md
├── 07-decision-trees.md
├── 08-anti-patterns.md
└── 09-checklists.md
```

---

## Knowledge Unit Inventory
| Name | Purpose | Difficulty | Dependencies |
|------|---------|------------|--------------|
| DTOs and Transformers | Immutable data contracts between layers | Intermediate | PHP 8.1+ readonly, Use Case Classes |
| DTO Definition | readonly classes, typed properties, named constructors | Intermediate | DTOs and Transformers |
| Input DTOs | Data from HTTP/CLI to Application layer | Intermediate | Form Requests |
| Output DTOs | Data from Application to Presentation layer | Intermediate | DTO Definition |
| Transformers | Internal-to-external format conversion | Intermediate | Output DTOs |
| DTO vs VO | Data transfer vs domain modeling distinction | Intermediate | Value Objects |

---

## Dependency Graph
```
PHP 8.1+ readonly → DTOs and Transformers
                    ├── Input DTOs ← Form Requests
                    ├── Output DTOs → Transformers → API Resources
                    └── DTO vs VO ← Value Objects (domain modeling)
```

---

## Boundary Analysis
**In scope**: DTO immutability, readonly classes, typed properties, named constructors (`fromRequest`, `fromArray`, `fromModel`), serialization control (`toArray()`), Transformer pattern for presentation formatting, input vs output DTOs, one DTO per Use Case boundary, DTO vs VO distinction, performance of DTO overhead, security of explicit field selection.

**Out of scope**: Value Object design and validation, Eloquent model design, API Resource internals, JSON:API specification, generic serialization formats, database mapping, Event DTOs for event sourcing.

---

## Future Expansion Opportunities
- Spatie Laravel Data package integration patterns
- Nested DTO flattening and composition
- Automatic Transformer generation from DTO metadata
- DTO validation pipeline integration
- DTO versioning for API contract evolution
