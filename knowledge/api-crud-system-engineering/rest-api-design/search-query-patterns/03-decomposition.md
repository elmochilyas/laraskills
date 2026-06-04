# Search Query Patterns — Decomposition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** rest-api-design
- **Knowledge Unit:** Search Query Patterns
- **Last Updated:** 2026-06-04

---

## Topic Overview
Search Query Patterns covers free-text search in REST APIs — how to accept search terms, rank results, leverage full-text indexes or dedicated search engines, and combine search with filtering and pagination.

---

## Decomposition Strategy
This KU is separated from filtering because search and filtering are fundamentally different operations. Filtering narrows by exact criteria; search finds by relevance. They require different infrastructure, query patterns, and performance considerations.

---

## Proposed Folder Structure
```
rest-api-design/
└── search-query-patterns/
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
| Search Query Patterns | Implement free-text search in REST APIs | Advanced | Query Parameter Filtering, Database Indexing |

---

## Dependency Graph
```
Query Parameter Filtering
  ├─ Database Indexing
  └─ Search Query Patterns
       ├─ Query Parameter Sorting
       ├─ Pagination Strategies
       └─ Full-Text Search Implementation
```

---

## Boundary Analysis
**In scope:** Search parameter conventions (q, search), full-text search (MySQL FULLTEXT, PostgreSQL tsvector), dedicated search engines (Meilisearch, Algolia), result ranking, fuzzy matching, searchable fields allowlist, minimum query length, search + filter combination, search pagination with stable ranking
**Out of scope:** Filter parameter design, sorting, autocomplete/suggest endpoints, search analytics, search index management

---

## Future Expansion Opportunities
- Faceted search implementation
- Search analytics and query optimization
- Autocomplete/suggest API design
- Multi-language search strategies
- Vector search for semantic similarity
