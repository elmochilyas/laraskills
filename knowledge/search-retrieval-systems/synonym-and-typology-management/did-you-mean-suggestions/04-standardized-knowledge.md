| Metadata | |
|---|---|
| KU ID | ku-09 |
| Subdomain | relevance-and-ranking |
| Topic | Did-You-Mean Suggestions |
| Source | Industry |
| Maturity | Stable |

## Overview

"Did you mean?" suggestions correct misspelled or ambiguous queries by suggesting alternative search terms. Methods include Levenshtein distance dictionaries, n-gram similarity, and LLM-based correction. Most dedicated search engines (Meilisearch, Typesense, Algolia) provide built-in typo tolerance that effectively implements "did you mean" through automatic correction.

## Core Concepts

- **Query Suggestion**: Alternative query that returns more/better results
- **Spelling Correction**: Correcting misspelled words in the query
- **Phonetic Matching**: Soundex, Metaphone for phonetic misspellings
- **N-gram Similarity**: Shared trigram-based fuzzy matching
- **Contextual Correction**: Using query logs to find frequently co-occurring corrections

## When To Use

- Search returning zero or few results for common misspellings
- Applications with user-generated content (more typos)
- International users (more varied spelling errors)
- Mobile search (more typing errors)

## When NOT To Use

- Exact-match search domains (SKU, order numbers)
- Typo tolerance already handles corrections well
- Very low search traffic (insufficient query log data)

## Best Practices

1. **Enable typo tolerance**: Let engine handle common misspellings automatically.
2. **Use search analytics**: Identify zero-result queries as suggestion candidates.
3. **Provide both correction and original**: "Showing results for X. Search for Y instead?"
4. **Monitor suggestion CTR**: Track if users click suggested corrections.
5. **Cache popular suggestions**: Reduce computation overhead.

## Related Topics

- K025 (Meilisearch typo tolerance)
- K040 (Typesense typo tolerance)
- K011 (Search analytics)

## AI Agent Notes

- Engine typo tolerance handles most "did you mean" cases automatically
- Custom implementation needed for analytics-driven suggestions
- For agents: start with engine typo tolerance, add suggestions for zero-result queries

## Verification

- [ ] Engine typo tolerance configured
- [ ] Zero-result query tracking
- [ ] Suggestion display in UI
- [ ] Suggestion CTR monitored
