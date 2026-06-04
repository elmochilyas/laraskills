# Domain Entity to Eloquent Model Mapping — Decomposition

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-10-domain-eloquent-mapping
- **Last Updated:** 2026-06-04

---

## Topic Overview
Bidirectional mapping between pure Domain objects (Entities, Value Objects, Aggregates) and Eloquent Models (database-aware persistence objects) within Repository implementations in the Infrastructure layer.

---

## Decomposition Strategy
The topic splits by (1) mapping direction — hydrator (Model→Domain) vs extractor (Domain→Model) as independent concerns; (2) mapping complexity — simple primitive fields vs complex Value Objects vs nested Aggregate structures; (3) mapping strategies — full replacement vs diff-based persistence; (4) testing — round-trip verification, edge cases, and performance profiling. This avoids overlapping with Repository pattern design by focusing on the mapping mechanics themselves.

---

## Proposed Folder Structure
```
02-layered-architecture-patterns/LAP-10-domain-eloquent-mapping/
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
| Domain-Eloquent Mapping | Bidirectional conversion between Domain and ORM | Advanced | DDD Tactical Patterns, Value Objects |
| Hydrator (Model→Domain) | Constructing Domain Objects from database state | Advanced | Value Objects, Aggregates |
| Extractor (Domain→Model) | Persisting Domain Objects to database | Advanced | Value Objects, Aggregates |
| Round-Trip Testing | Validating mapping fidelity | Advanced | Hydrator, Extractor |
| Persistence Diff | Partial update vs full replacement | Advanced | Extractor |

---

## Dependency Graph
```
DDD Tactical Patterns → Domain-Eloquent Mapping
                        ├── Hydrator ← Eager Loading (N+1 prevention)
                        ├── Extractor ← Value Object flattening
                        ├── Round-Trip Testing ← equals() on Domain objects
                        └── Persistence Diff ← Transaction boundaries
```

---

## Boundary Analysis
**In scope**: Hydrator construction from Eloquent models, extractor persistence to Eloquent models, Value Object conversion (flattening/reconstruction), nested entity handling, circular reference breaking, round-trip testing, eager loading strategy, identity mapping (UUID vs auto-increment), mapping in Repository implementations.

**Out of scope**: Repository interface design, generic Repository pattern debate, Eloquent model design, migration design, database schema decisions, Active Record vs Data Mapper comparison, CQRS read model mapping.

---

## Future Expansion Opportunities
- Automated mapping generation from domain-to-schema metadata
- Mapping performance benchmarking framework
- Circular reference detection and breaking strategies
- Partial update diff algorithm optimization
