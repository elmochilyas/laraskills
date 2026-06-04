# API Response Metadata — Decomposition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** response-structures
- **Knowledge Unit:** API Response Metadata
- **Last Updated:** 2026-06-04

---

## Topic Overview
API Response Metadata covers non-primary data included in API responses — request IDs, timestamps, version info, and tracing context — for debugging, correlation, and client awareness.

---

## Decomposition Strategy
This KU is separated from response shapes because metadata is an orthogonal concern — it applies to all response types (data, errors, pagination) and has distinct concerns around correlation, tracing, and security.

---

## Proposed Folder Structure
```
response-structures/
└── api-response-metadata/
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
| API Response Metadata | Include request IDs, timestamps, and version info in responses | Foundation | API Response Shapes |

---

## Dependency Graph
```
API Response Shapes
  └─ API Response Metadata
       ├─ Top-Level Meta and Links
       ├─ Pagination Metadata Design
       └─ Response Envelope Design
```

---

## Boundary Analysis
**In scope:** Metadata field design (request_id, timestamps, version), middleware-based injection, base resource metadata, security considerations for metadata exposure
**Out of scope:** Pagination metadata (separate KU), response envelope structure, error response metadata, distributed tracing

---

## Future Expansion Opportunities
- Distributed tracing metadata propagation
- Feature-flag driven metadata
- Performance timing metadata
- Client SDK auto-discovery via metadata
