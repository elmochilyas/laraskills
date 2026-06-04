# API Response Shapes — Decomposition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** response-structures
- **Knowledge Unit:** API Response Shapes
- **Last Updated:** 2026-06-04

---

## Topic Overview
API Response Shapes defines the top-level structure of all API responses — envelope vs bare, success vs error shapes, and consistency enforcement across endpoints.

---

## Decomposition Strategy
This KU is separated from specific response components (metadata, links, resources) because the top-level shape is the foundational contract that all other response components fit into. It must be chosen before metadata or transformation patterns are applied.

---

## Proposed Folder Structure
```
response-structures/
└── api-response-shapes/
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
| API Response Shapes | Define top-level response structure (envelope, bare, JSON:API) | Foundation | JSON Format, HTTP Status Codes |

---

## Dependency Graph
```
JSON / HTTP
  └─ API Response Shapes
       ├─ API Resource Transformation
       ├─ API Response Metadata
       ├─ Top-Level Meta and Links
       └─ Error Response Shapes
```

---

## Boundary Analysis
**In scope:** Envelope vs bare body decision, JSON:API shape, custom envelope shape, success/error/empty response shapes, shape consistency enforcement
**Out of scope:** Specific metadata fields, pagination link generation, resource transformation internals, error code taxonomy

---

## Future Expansion Opportunities
- JSON:API specification deep dive
- Custom envelope response implementation
- Shape testing via contract tests
- Versioned response shape strategies
