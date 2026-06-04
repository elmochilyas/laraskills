# Skill: Implement Search Query Patterns

## Purpose
Implement search functionality via query parameters combining filtering with full-text search, using MySQL `MATCH...AGAINST`, PostgreSQL `tsvector`, or Laravel Scout with Algolia/MeiliSearch.

## When To Use
- Text search across multiple fields
- Large text datasets requiring indexing
- Autocomplete or typeahead functionality
- Product, user, or content search

## When NOT To Use
- Exact-value filtering — use standard filtering instead
- Small datasets (<1000 records) — use simple WHERE LIKE
- Code/ID search — use exact match filter

## Prerequisites
- Database full-text index configuration
- Laravel Scout or native full-text search

## Inputs
- Searchable fields and models
- Search query format specification

## Workflow
1. Choose search approach: Scout (Algolia/MeiliSearch) for external, MySQL/PgSQL full-text for internal
2. Configure search indexes: Scout model configuration or DB full-text index creation
3. Parse search query from `?q=` or `?search=` query parameter
4. Implement search scope on model with searchable fields list
5. Escape special characters for search engine — prevent syntax errors and injection
6. Use `MATCH...AGAINST` in BOOLEAN MODE for MySQL partial matching
7. Implement relevance scoring and sorting: order by relevance score descending
8. Combine search with filters and pagination — search is a filter operation
9. Limit minimum query length — 2+ characters minimum, return empty results for shorter
10. Log search queries for analytics and improvement (anonymized)

## Validation Checklist
- [ ] Search approach chosen (Scout or full-text index)
- [ ] Search indexes configured
- [ ] `q` or `search` query parameter accepted
- [ ] Searchable fields whitelist defined
- [ ] Special characters escaped for search engine
- [ ] Relevance scoring and sorting implemented
- [ ] Combined with filters and pagination
- [ ] Minimum query length enforced
- [ ] Empty/short query returns empty results or full list
- [ ] Search queries logged (anonymized)

## Common Failures
- Using `LIKE '%term%'` on large datasets — full table scan, no index usage
- No relevance scoring — results in arbitrary order
- No minimum query length — single character queries return too many results
- No field whitelist — search on all columns including sensitive ones
- Search not combined with filters — search results bypass access filters
- Special characters breaking query — `!@#$` causing 500 error
- No pagination on search — large result sets without limits

## Decision Points
- Scout vs native DB — Scout for dedicated search (better relevance, autocomplete), DB for simple search
- MySQL vs PostgreSQL full-text — MySQL MATCH for simple, PgSQL tsvector for advanced
- Searchable field specificity — name only vs name+description+tags

## Performance Considerations
- `MATCH...AGAINST` on indexed columns is O(log n) — fast even on large tables
- `LIKE '%term%'` is O(n) — full table scan, avoid for text search
- Scout search is network call + external service — 10-100ms latency
- Pagination on search results prevents large result processing
- Combine search with other filters to reduce result set before full-text processing

## Security Considerations
- Escape special characters to prevent search engine injection attacks
- Whitelist searchable fields — never allow search on sensitive fields
- Anonymized search logging prevents PII collection
- Search results must respect authorization — don't return unauthorized records
- SQL injection prevention via parameterized queries or Scout's safe API

## Related Rules
- Choose Appropriate Search Engine (Scout vs Native)
- Define Searchable Field Whitelist
- Implement Relevance Scoring
- Combine Search With Filters and Pagination
- Enforce Minimum Query Length
- Log Search Queries (Anonymized)

## Related Skills
- Query Parameter Filtering — for combined search + filter queries
- Pagination Strategy Selection — for paginated search results
- Search Index Configuration — for Scout or full-text index setup

## Success Criteria
- Search returns relevant results ordered by relevance
- Searchable fields only include intended columns
- Minimum query length prevents prohibitive results
- Search combines with other filters correctly
- No injection or syntax errors from special characters
- Search performance is acceptable on full dataset
- Anonymized search queries logged for analytics
