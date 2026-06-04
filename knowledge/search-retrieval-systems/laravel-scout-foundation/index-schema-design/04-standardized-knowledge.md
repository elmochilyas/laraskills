| Metadata | |
|---|---|
| KU ID | ku-01 |
| Subdomain | search-indexing-and-synchronization |
| Topic | Index Schema Design |
| Source | Laravel Scout / Search Engine Docs |
| Maturity | Stable |

## Overview

Index schema design defines what data goes into the search index, how it's structured, and which fields are searchable, filterable, sortable. Scout's 	oSearchableArray() method controls the indexed payload. Schema differs per engine: Meilisearch is schema-free, Typesense requires explicit field types, Algolia combines both approaches.

## Core Concepts

- **toSearchableArray()**: Defines the fields sent to the search index per model
- **searchableAs()**: Custom index name per model
- **Filterable Attributes**: Fields usable for WHERE/filter clauses
- **Sortable Attributes**: Fields usable for ORDER BY
- **Schema-Free (Meilisearch)**: Fields inferred from first indexed document
- **Schema-Enforced (Typesense)**: Explicit field type declaration required

## When To Use

- Any Scout-based search implementation
- Adding new models to search
- Optimizing index storage (only index needed fields)

## When NOT To Use

- Using Scout's database engine (table schema is the index schema)

## Best Practices

1. **Only index needed fields**: Reduce index size, improve performance.
2. **Normalize data in toSearchableArray()**: Transform relations, format dates.
3. **Declare filterable/sortable attributes**: Prevent silent query failures.
4. **Use typed casts**: Ensure numeric fields are integers, not strings.
5. **Include tenant/policy fields**: For multi-tenant filtering and access control.

## Related Topics

- K005 (toSearchableArray)
- K006 (searchableAs)
- K024 (Filterable/sortable attributes)
- K034 (Typesense collection schemas)

## AI Agent Notes

- Schema design impacts search quality and performance significantly
- Over-indexing (too many fields) is more common than under-indexing
- For agents: start with 5-10 most important fields, add more as needed

## Verification

- [ ] toSearchableArray() returns correct fields
- [ ] Filterable attributes declared
- [ ] Sortable attributes declared
- [ ] Field types match indexed data
- [ ] Relations properly denormalized
- [ ] Index size monitored
