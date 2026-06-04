---
## Rule Name
Use SQLite VSS for Development Only

## Category
Architecture

## Rule
Use SQLite VSS only for development, testing, and CI environments; never for production Laravel applications.

## Reason
SQLite is single-writer and not suitable for production web applications. pgvector is the production equivalent for PostgreSQL.

## Bad Example
```php
// SQLite VSS in production — not suitable
$results = DB::select("SELECT id FROM vss_items WHERE vss_search(embedding, '$vector') LIMIT 10");
```

## Good Example
```php
// pgvector in production
$results = DB::select("SELECT id FROM items ORDER BY embedding <=> ? LIMIT 10", [$vector]);
```

## Exceptions
Embedded/IoT Laravel applications where SQLite is the production database.

## Consequences Of Violation
Write contention, concurrency issues, and production instability.

---
## Rule Name
Match SQLite VSS Schema to Production

## Category
Testing

## Rule
Use the same vector dimensions and distance metric in SQLite VSS as your production pgvector setup.

## Reason
Mismatched dimensions cause silent test failures — tests pass but vector queries behave differently in production.

## Bad Example
```sql
-- Test uses different dimensions than production
CREATE VIRTUAL TABLE vss_items USING vss0(embedding(512));
-- Production uses 1536
```

## Good Example
```sql
-- Test matches production dimensions
CREATE VIRTUAL TABLE vss_items USING vss0(embedding(1536));
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Tests passing but vector search behavior differs in production, leading to undetected bugs.

---
## Rule Name
Limit SQLite VSS to Testing Vector Logic

## Category
Testing

## Rule
Use SQLite VSS exclusively for testing and prototyping vector search logic, not as a permanent storage solution.

## Reason
SQLite VSS provides convenient vector search for test suites without requiring PostgreSQL+pgvector infrastructure.

## Bad Example
```bash
# All tests require pgvector — harder to run locally
phpunit --require-pgvector
```

## Good Example
```bash
# Use SQLite for unit tests, pgvector for integration
phpunit
# Tests that don't need exact pgvector behavior pass without it
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Development friction requiring full PostgreSQL+pgvector setup for all testing.
