# Resource Controller Methods — Decomposition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** resource-controllers
- **Knowledge Unit:** Resource Controller Methods
- **Last Updated:** 2026-06-04

---

## Topic Overview
Resource Controller Methods covers the seven standard CRUD actions (index, show, store, update, destroy) and their conventions for HTTP method mapping, route registration, and request/response patterns.

---

## Decomposition Strategy
This KU is separated from general routing because resource controllers represent a specific convention with standardized method signatures, response codes, and route bindings that deserve dedicated treatment.

---

## Proposed Folder Structure
```
resource-controllers/
└── resource-controller-methods/
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
| Resource Controller Methods | Standard CRUD controller actions and conventions | Foundation | HTTP Methods, Laravel Routing |

---

## Dependency Graph
```
HTTP Methods / Laravel Routing
  └─ Resource Controller Methods
       ├─ Nested Resource Controllers
       ├─ Single-Action Invokable Controllers
       └─ Controller Middleware Assignment
```

---

## Boundary Analysis
**In scope:** Seven standard actions, apiResource vs resource, method signatures, response conventions, route-model binding, thin controller delegation
**Out of scope:** Nested resource design, custom controller methods, non-CRUD endpoints, authentication/authorization implementation

---

## Future Expansion Opportunities
- Custom resource method patterns
- Controller method alternative conventions (POST for search, etc.)
- Versioned resource controller patterns
