# Top-Level Meta and Links — Decomposition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** response-structures
- **Knowledge Unit:** Top-Level Meta and Links
- **Last Updated:** 2026-06-04

---

## Topic Overview
Top-Level Meta and Links provide navigation URLs and contextual metadata alongside API response data, enabling self-describing, discoverable API responses.

---

## Decomposition Strategy
This KU is separated from general response shapes because links and meta are specific components with unique concerns — URL generation, HATEOAS compliance, authorization-aware action links — that are distinct from the overall envelope design.

---

## Proposed Folder Structure
```
response-structures/
└── top-level-meta-links/
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
| Top-Level Meta and Links | Include navigation links and metadata in responses | Intermediate | API Response Shapes, Pagination Metadata Design |

---

## Dependency Graph
```
API Response Shapes
  ├─ Pagination Metadata Design
  └─ Top-Level Meta and Links
       ├─ API Response Metadata
       └─ HATEOAS Hypermedia Controls
```

---

## Boundary Analysis
**In scope:** Meta object design, links object design (self, related, pagination, actions), URL generation strategies, authorization-aware action links, pagination link structure
**Out of scope:** Resource-specific meta fields, error response meta, HATEOAS full implementation, Link HTTP headers

---

## Future Expansion Opportunities
- HATEOAS full implementation with resource state machines
- JSON:API links/meta specification compliance
- Dynamic action link generation based on resource state
- Link discovery protocols (RFC 8631)
