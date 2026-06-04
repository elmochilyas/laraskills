| Metadata | |
|---|---|
| KU ID | K026 |
| Subdomain | synonym-and-typology-management |
| Topic | Meilisearch Synonym Management |
| Source | Meilisearch Docs |
| Maturity | Stable |

## Overview

Meilisearch synonyms enable defining equivalent terms that produce the same search results. Synonyms can be one-way (e.g., "iOS" → "iPhone", "iPad") or bidirectional (e.g., "shoe" ↔ "sneaker" ↔ "trainer"). Synonyms improve recall by matching different terminology for the same concept.

## Core Concepts

- **Bidirectional Synonyms**: Both terms in the synonym group produce equivalent results
- **One-Way Synonyms**: Source term maps to targets but not vice versa
- **API Management**: Configured via Meilisearch settings API or `scout:sync-index-settings`
- **Per-Index Synonyms**: Sets are specific to each index/model
- **Query Expansion**: Original term + synonyms are searched; original term matches score higher

## When To Use

- E-commerce sites with varied product terminology (e.g., "sneakers" vs "trainers")
- Content sites where users use different vocabulary than indexed content
- Acronym-heavy domains (e.g., "API" ↔ "Application Programming Interface")
- Industry jargon mapping (technical terms to common equivalents)

## When NOT To Use

- When query precision is critical and catch-all matching causes false positives
- As a substitute for improving indexed data quality
- When synonym chains create circular expansion patterns

## Best Practices

1. **Audit synonyms regularly** — remove outdated or incorrect mappings
2. **Test changes** with representative queries before deploying
3. **Monitor search analytics** for zero-result queries as new synonym candidates
4. **Document rationale** for each synonym mapping
5. **Prefer bidirectional** for general equivalences, one-way for specific relationships
6. **Keep synonym sets lean** — over-expansion reduces precision

## Architecture Guidelines

- Configure via Meilisearch settings API, not Scout's minimal abstraction
- Store synonym definitions in version control as JSON files
- Use symmetrical, acyclic synonym graphs — avoid cycles
- Align synonym strategy with stemmer configuration to avoid redundant processing

## Performance Considerations

- Query expansion with synonyms adds microseconds per synonym to query processing
- Large sets (>10K pairs) may impact indexing time
- Original term matches score higher than synonym matches by default

## Security Considerations

- Synonyms do not expose security boundaries — they only affect result matching
- No special security considerations beyond standard API key management

## Common Mistakes

- Creating circular synonym chains causing excessive expansion
- Making specific terms bidirectional when they should be one-way
- Neglecting synonym cleanup as product catalogs evolve
- Relying solely on synonyms instead of fixing data quality

## Anti-Patterns

- **Circular synonyms**: A↔B, B↔C, C↔A — creates unpredictable expansion
- **Over-expansion**: Broad synonyms matching too many documents
- **Static-only**: Expecting synonyms to cover terminology without updates

## Examples

```
// Bidirectional synonym (settings API)
{
  "synonyms": {
    "shoe": ["sneaker", "trainer", "footwear"],
    "sneaker": ["shoe", "trainer", "footwear"]
  }
}

// One-way synonym
{
  "synonyms": {
    "iOS": ["iPhone", "iPad"]
  }
}
```

## Related Topics

- K023 (Meilisearch driver setup)
- K039 (Typesense synonym management)
- K024 (Meilisearch filterable/sortable)
- K025 (Meilisearch typo tolerance)

## AI Agent Notes

- Synonym management improves recall — use bidirectional for genuine equivalences, one-way for narrower mappings
- Review and update synonym sets as the product vocabulary evolves
- For agents: always test synonym changes against production query logs before deploying
