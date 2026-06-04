| Metadata | |
|---|---|
| KU ID | K039 |
| Subdomain | synonym-and-typology-management |
| Topic | Typesense Synonym Management |
| Source | Typesense Docs |
| Maturity | Stable |

## Overview

Typesense provides synonym management via its API, allowing configuration of equivalent terms that expand query matching. Synonyms can be bidirectional (`multi_way`) or one-way (`one_way`). Unlike Meilisearch's settings-based approach, Typesense manages synonyms as separate API resources that can be created, updated, and deleted independently.

## Core Concepts

- **Synonym Types**: `multi_way` (bidirectional), `one_way` (directional)
- **Root Concept**: A single root concept maps to multiple synonyms in one-way mode
- **API Resources**: Managed via `/collections/{name}/synonyms` endpoint
- **Per-Collection**: Synonyms scoped to a specific collection/index
- **Independent Lifecycle**: Synonyms managed separately from other index settings

## When To Use

- E-commerce with varied product terminology
- Content platforms with diverse user vocabularies
- Multi-language sites needing cross-language equivalence mapping
- When synonym sets are large and change independently of other settings

## When NOT To Use

- When Scout's `scout:sync-index-settings` is the only integration path
- For simple, static synonym sets better suited to Meilisearch's settings approach
- When API-based management adds unnecessary operational complexity

## Best Practices

1. **Use Typesense API directly** — Scout does not abstract synonym management
2. **Version-control configurations** as JSON files
3. **Test expansion** — verify queries with synonyms return expected results
4. **Audit regularly** — remove outdated mappings
5. **Use `multi_way` for genuine equivalences**, `one_way` for directional mappings
6. **Export and review** synonym configurations periodically

## Architecture Guidelines

- Separate synonym management from index settings to leverage Typesense's resource model
- Use bulk import for initial synonym population
- Implement a Laravel service class wrapping the Typesense synonym API
- Keep synonym graphs acyclic to avoid expansion loops

## Performance Considerations

- Query expansion adds minimal latency (microseconds per synonym)
- Very large collections (>100K) may increase indexing time
- API-resource approach scales to thousands of synonym sets

## Security Considerations

- No data access implications — synonyms only affect query matching
- Use search-only API keys for query endpoints, master keys for synonym management

## Common Mistakes

- Relying on Scout to manage synonyms — Scout has no synonym API abstraction
- Creating chains causing excessive expansion (A→B→C→A)
- Not testing synonym impact before deployment
- Using wrong synonym type (one_way vs multi_way)

## Anti-Patterns

- **Settings-based management**: Expecting Scout to handle synonym sync automatically
- **No version control**: Managing synonyms only through API calls without backups
- **Expansion overload**: Too many synonyms for a root term causing imprecise results

## Examples

```
// multi_way (bidirectional)
{
  "synonyms": {
    "laptop": ["notebook", "ultrabook"],
    "notebook": ["laptop", "ultrabook"]
  }
}

// one_way (directional)
{
  "synonyms": {
    "nike": ["air max", "jordan"]
  }
}
```

## Related Topics

- K033 (Typesense driver setup)
- K034 (Typesense collection schemas)
- K026 (Meilisearch synonym management)
- K040 (Typesense typo tolerance)

## AI Agent Notes

- Typesense synonyms are API resources, not settings — manage them via direct API calls
- Scout does not abstract Typesense synonym management
- For agents: implement a dedicated service class for synonym CRUD operations against Typesense
