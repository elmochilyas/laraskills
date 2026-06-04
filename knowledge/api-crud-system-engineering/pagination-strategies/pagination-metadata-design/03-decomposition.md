# Pagination Metadata Design — Decomposition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** pagination-strategies
- **Knowledge Unit:** Pagination Metadata Design
- **Last Updated:** 2026-06-04

---

## Topic Overview
Pagination Metadata Design defines what pagination information API responses include — page numbers, cursor tokens, totals, links, and navigation hints — enabling clients to build robust navigation.

---

## Decomposition Strategy
This KU is separated from individual pagination strategies (offset, cursor) because metadata design is a cross-cutting concern that applies regardless of the underlying pagination mechanism. Separating it allows consistent metadata patterns regardless of strategy.

---

## Proposed Folder Structure
```
pagination-strategies/
└── pagination-metadata-design/
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
| Pagination Metadata Design | Design pagination metadata in API responses | Intermediate | Offset-Based Pagination, Cursor-Based Pagination |

---

## Dependency Graph
```
Offset Pagination  Cursor Pagination
        \              /
   Pagination Metadata Design
              |
     API Resource Transformation
```

---

## Boundary Analysis
**In scope:** Metadata structure design, pagination links (first/last/next/prev), field naming conventions, cursor vs offset metadata, header metadata (Link headers), JSON:API format
**Out of scope:** Pagination implementation details, database query optimization, UI component rendering

---

## Future Expansion Opportunities
- Custom paginator metadata classes
- JSON:API specification compliance
- GraphQL Relay pagination metadata
- Multi-format metadata (body + headers)
