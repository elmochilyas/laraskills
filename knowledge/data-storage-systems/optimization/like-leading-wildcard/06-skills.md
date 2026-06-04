# Skill: Avoid Leading Wildcard LIKE Queries

## Purpose
Eliminate `LIKE '%term'` and `LIKE '%term%'` queries that force full table scans by using full-text search or alternative approaches.

## When To Use
- When implementing search functionality
- When reviewing queries with LIKE operators
- When EXPLAIN shows `ALL` on a LIKE-filtered query

## When NOT To Use
- When using `LIKE 'term%'` (trailing wildcard only) — this is sargable
- When using pg_trgm GIN indexes that support leading wildcards
- On very small tables

## Prerequisites
- Understanding of sargability
- Knowledge of full-text search alternatives

## Inputs
- Query using LIKE with leading wildcard pattern

## Workflow
1. Identify LIKE patterns: `LIKE '%term'` or `LIKE '%term%'`
2. If trailing wildcard only (`LIKE 'term%'`): no action needed — sargable
3. If leading wildcard: choose alternative:
   - Full-text search (MySQL FULLTEXT, PostgreSQL tsvector GIN)
   - pg_trgm extension for PostgreSQL ILIKE support
   - Laravel Scout with Meilisearch/Algolia/Typesense
4. Implement alternative and verify EXPLAIN shows index usage

## Validation Checklist
- [ ] No `LIKE '%value'` or `LIKE '%value%'` on indexed columns
- [ ] Full-text search index created for text search patterns
- [ ] EXPLAIN shows index usage for search queries
- [ ] pg_trgm index created for PostgreSQL ILIKE queries if needed

## Common Failures
- Using LIKE on large text columns without considering full-text alternatives
- Assuming full-text search is too complex — PostgreSQL GIN + tsvector is straightforward
- Not testing with production-scale data volumes

## Decision Points
- Prefix search only: `LIKE 'prefix%'` is acceptable with B-tree index
- Substring search: use full-text search or pg_trgm
- Natural language search: use full-text search or dedicated search engine

## Performance
- `LIKE '%term%'`: full table scan — O(n)
- Full-text search (indexed): O(log n) — 10-100x faster on large datasets
- pg_trgm: supports `ILIKE '%term%'` with index — good for fuzzy matching

## Security
- Full-text search with `plainto_tsquery` prevents query operator injection
- LIKE with user input must be properly escaped to prevent SQL injection

## Related Rules
- 4-9-1: Always EXPLAIN Before Optimizing
- 4-9-4: Review And Apply Core Concepts

## Related Skills
- Write Sargable WHERE Conditions
- Detect Function Wraps in WHERE

## Success Criteria
- Leading wildcard LIKE queries eliminated
- Alternative search solution implemented with proper index
- Search performance confirmed with EXPLAIN
