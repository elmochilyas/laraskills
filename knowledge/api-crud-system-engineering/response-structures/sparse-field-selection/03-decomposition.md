# Sparse Field Selection — Decomposition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** response-structures
- **Knowledge Unit:** Sparse Field Selection
- **Last Updated:** 2026-06-04

---

## Topic Overview
Sparse Field Selection allows API consumers to specify which fields to include in responses via `?fields`, reducing payload size and giving clients control over response content.

---

## Decomposition Strategy
This KU is separated from general response transformation because sparse field selection has unique concerns — field allowlist enforcement, query-level vs resource-level filtering, and computed field handling — that require dedicated treatment.

---

## Proposed Folder Structure
```
response-structures/
└── sparse-field-selection/
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
| Sparse Field Selection | Allow clients to select specific fields in responses | Advanced | API Resource Transformation, Eloquent Queries |

---

## Dependency Graph
```
API Resource Transformation
  └─ Sparse Field Selection
       ├─ Include Related Resources
       └─ Query Parameter Filtering
```

---

## Boundary Analysis
**In scope:** Fields parameter syntax, field allowlist design, query-level vs resource-level selection, computed/accessor field handling, relationship field selection, permission-based field visibility
**Out of scope:** Include parameter design, response envelope design, database schema design, client-side field filtering

---

## Future Expansion Opportunities
- Permission-based field visibility per role
- Dynamic field computation with sparse selection
- Query-level field selection with computed field fallback
- Field selection caching strategies
