---
paths:
  - "**/*.php"
  - "**/database/migrations/**"
---

# Laravel 13 Database Engineering Rules

> This file extends [common/patterns.md](../common/patterns.md) with database engineering rules.

## Query Design

- No `SELECT *` in production queries — always specify columns.
- Filter data in the database, not in application code.
- Always paginate large result sets (`LIMIT` / `OFFSET` or `cursorPaginate`).
- Use parameterized bindings for ALL queries — never interpolate user input into SQL strings.

## Indexing

- Index all foreign key columns.
- Composite index column order must match query filter order (left-most rule for MySQL, left-most for PostgreSQL).
- Use partial indexes for filtered queries on large tables (PostgreSQL: `WHERE` clause; MySQL: use generated columns).
- Use covering indexes (PostgreSQL: `INCLUDE` clause; MySQL: add all columns to the composite index).
- Review for over-indexing — every index slows writes.
- Run `pg_stat_user_indexes` (PostgreSQL) or `performance_schema.table_io_waits_summary_by_index_usage` (MySQL) to find unused indexes.

## Performance

- N+1 queries are production bugs — use eager loading.
- Every critical query must be analyzed with `EXPLAIN ANALYZE` before deployment.
- Enable `Model::preventLazyLoading()` in local/testing environments.
- Use aggregate methods (`withCount`, `withSum`) instead of loading collections.
- Use `cursorPaginate()` for large datasets.

## PostgreSQL

- Use JSONB for semi-structured data with GIN indexes for queries.
- Use materialized views for expensive aggregation queries, refresh concurrently.
- Use UUID columns for distributed systems, auto-increment for single-server.
- Use `pg_stat_statements` to identify slow queries in production.

## MySQL

- Always use `utf8mb4` charset (not legacy `utf8` which is 3-byte only).
- Use InnoDB engine only — never MyISAM for production data.
- Set InnoDB buffer pool to 70-80% of available RAM for dedicated servers.
- Use functional indexes `((expr))` for indexed expressions (MySQL 8.0.13+).
- Use invisible indexes to test drop impact before removing.
- MySQL's `REPEATABLE READ` default uses gap locks — consider `READ COMMITTED` for high-concurrency workloads.
- Emulate partial indexes with generated columns + indexes on the generated column.
- Use `utf8mb4_unicode_ci` or `utf8mb4_0900_ai_ci` (MySQL 8.0+) for collation.

## Vector Search

- Vector search requires PostgreSQL + pgvector extension + `laravel/ai` SDK (not available on MySQL).
- Always add HNSW index to vector columns for production datasets.
- Generate embeddings in background jobs, never during user requests.
- Use `minSimilarity` threshold to filter out irrelevant results.

## Transactions

- All multi-step writes must be wrapped in `DB::transaction()`.
- Acquire locks in consistent order across all transactions.
- Set `DB::transaction(attempts: 5)` for deadlock retry.
- Never retry validation errors or business rule violations.

## Full-Text Search

- Create full-text indexes before using `whereFullText()`.
- Use Scout's database engine with `SearchUsingFullText` attribute for relevance ordering on PostgreSQL.
- Avoid `LIKE '%keyword%'` on large tables — use full-text indexes.
- MySQL: words shorter than `innodb_ft_min_token_size` (default 3) are ignored in full-text — use `LIKE` fallback for short search terms.

## Enterprise Checklist

Before merging, verify:
- [ ] No SELECT * — always specify columns
- [ ] Foreign keys indexed
- [ ] Composite indexes match query filter order
- [ ] No N+1 queries
- [ ] All multi-step writes in transactions
- [ ] Deadlock retry configured
- [ ] Vector columns have HNSW index (PostgreSQL)
- [ ] Embeddings generated asynchronously
- [ ] Full-text indexes exist where `whereFullText` is used
- [ ] Queries use parameterized bindings
- [ ] MySQL: utf8mb4 charset confirmed (not legacy utf8)
- [ ] MySQL: InnoDB buffer pool correctly sized
- [ ] MySQL: PARTITION columns included in all primary/unique keys

## See Also

- Skill: `laravel-database` for comprehensive database engineering patterns
- Skill: `laravel-eloquent` for Eloquent ORM patterns
- Skill: `laravel-tdd` for database testing
- Agent: `laravel-database` for automated database engineering assistance
