# Nested Resource Controllers — Decomposition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** resource-controllers
- **Knowledge Unit:** Nested Resource Controllers
- **Last Updated:** 2026-06-04

---

## Topic Overview
Nested Resource Controllers handle CRUD for resources scoped to a parent resource, implementing clean URL hierarchies and proper authorization scoping.

---

## Decomposition Strategy
This KU is separated from general resource controllers because nesting introduces unique concerns — route scoping, authorization at multiple levels, shallow nesting decisions, and performance implications of parent-child query chains — that warrant dedicated treatment.

---

## Proposed Folder Structure
```
resource-controllers/
└── nested-resource-controllers/
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
| Nested Resource Controllers | Implement CRUD for parent-scoped resources | Intermediate | Resource Controller Methods, Route Model Binding |

---

## Dependency Graph
```
Resource Controller Methods
  ├─ Route Model Binding
  └─ Nested Resource Controllers
       ├─ Controller Middleware Assignment
       └─ Shallow Nesting Strategies
```

---

## Boundary Analysis
**In scope:** Nested route registration, full vs shallow nesting, implicit route model binding for nested routes, query scoping, authorization at parent and child levels
**Out of scope:** Resource controller method patterns, general routing, API resource transformation

---

## Future Expansion Opportunities
- Deep nesting (3+ levels) mitigation strategies
- Relationship-based route design
- Nested resource authorization optimization
