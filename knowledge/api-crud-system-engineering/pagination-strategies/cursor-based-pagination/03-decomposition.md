# Cursor-Based Pagination — Decomposition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** pagination-strategies
- **Knowledge Unit:** Cursor-Based Pagination
- **Last Updated:** 2026-06-04

---

## Topic Overview
Cursor-Based Pagination uses opaque cursor tokens for stable, performant pagination through large datasets without the phantom-read and performance problems of offset pagination.

---

## Decomposition Strategy
This KU is separated from offset pagination because cursor-based pagination uses fundamentally different mechanics (WHERE clause-based vs. LIMIT/OFFSET) and addresses different use cases (stable feeds vs. page-number UIs) with distinct tradeoffs.

---

## Proposed Folder Structure
```
pagination-strategies/
└── cursor-based-pagination/
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
| Cursor-Based Pagination | Implement stable cursor-based pagination for large datasets | Advanced | Database Indexing, SQL WHERE/ORDER BY |

---

## Dependency Graph
```
Database Indexing
  └─ Cursor-Based Pagination
       ├─ Offset-Based Pagination
       ├─ Pagination Metadata Design
       └─ Query Parameter Sorting
```

---

## Boundary Analysis
**In scope:** Cursor definition and encoding, forward/backward cursor navigation, simple and composite cursors, cursor stability, performance characteristics, cursor security (signing/encryption)
**Out of scope:** Offset pagination, total count calculation, UI pagination components, GraphQL Relay connection spec

---

## Future Expansion Opportunities
- Cursor-based pagination with UUID primary keys
- Encrypted/signed cursor implementation
- Composite cursor for multi-column sorting
- GraphQL Relay-compatible cursor pagination
