# Include Related Resources — Decomposition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** response-structures
- **Knowledge Unit:** Include Related Resources
- **Last Updated:** 2026-06-04

---

## Topic Overview
Including Related Resources allows API consumers to request eager-loaded relationships in responses via `?include=posts`, reducing API calls while requiring careful N+1 prevention and authorization.

---

## Decomposition Strategy
This KU is separated from general resource transformation because relationship inclusion introduces unique concerns — eager loading management, cyclic dependency handling, depth limiting, and relationship authorization — that are distinct from single-resource transformation.

---

## Proposed Folder Structure
```
response-structures/
└── include-related-resources/
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
| Include Related Resources | Allow clients to request eager-loaded related resources | Advanced | API Resource Transformation, Eloquent Eager Loading |

---

## Dependency Graph
```
API Resource Transformation
  ├─ Eloquent Eager Loading
  └─ Include Related Resources
       ├─ Sparse Field Selection
       └─ Conditional Relationship Inclusion
```

---

## Boundary Analysis
**In scope:** Include parameter design, relationship allowlist, eager loading integration, whenLoaded() pattern, dot-notation nesting, maximum depth enforcement, authorization for included resources
**Out of scope:** General resource transformation, relationship endpoints, JSON:API compound documents, GraphQL field selection

---

## Future Expansion Opportunities
- Cyclic include detection and prevention
- Include depth authorization policies
- Performance monitoring for include patterns
- Caching strategies for include-heavy responses
