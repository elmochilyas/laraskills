# API Resource Transformation — Decomposition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** response-structures
- **Knowledge Unit:** API Resource Transformation
- **Last Updated:** 2026-06-04

---

## Topic Overview
API Resource Transformation covers converting Eloquent models into structured JSON responses using Laravel's JsonResource classes for consistent API contracts.

---

## Decomposition Strategy
This KU is separated from general response shapes because resource transformation is a specific mechanism (JsonResource classes) with unique concerns — conditional attributes, relationship inclusion, collection handling — that are distinct from the broader response envelope design.

---

## Proposed Folder Structure
```
response-structures/
└── api-resource-transformation/
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
|------|---------|------------|-------------|
| API Resource Transformation | Transform models to JSON via JsonResource classes | Intermediate | Eloquent Models, Controller Responses |

---

## Dependency Graph
```
Eloquent Models
  └─ API Resource Transformation
       ├─ API Response Shapes
       ├─ Include Related Resources
       └─ Sparse Field Selection
```

---

## Boundary Analysis
**In scope:** JsonResource class design, toArray() method, conditional attributes (when, whenLoaded, merge), resource collections, paginated resources, relationship inclusion
**Out of scope:** Response envelope/wrapping (separate KU), error response transformation, request validation, GraphQL field selection

---

## Future Expansion Opportunities
- Custom resource collection classes
- Resource transformation caching strategies
- Conditional resource attributes for complex authorization
- Spatie laravel-data integration
