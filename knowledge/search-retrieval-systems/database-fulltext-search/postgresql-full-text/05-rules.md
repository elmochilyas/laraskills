## Use Generated tsvector Columns with GIN Indexes
---
## Category
Performance
---
## Rule
Always use generated `tsvector` columns with GIN indexes for PostgreSQL FTS; never compute `to_tsvector()` at query time.
---
## Reason
Runtime `to_tsvector()` computation on every search query adds significant overhead. Generated columns pre-compute the tsvector on write, and GIN indexes accelerate the `@@` operator, making reads extremely fast.
---
## Bad Example
```php
// No generated column — to_tsvector() computed on every search
SELECT * FROM posts WHERE to_tsvector('english', title) @@ plainto_tsquery('search');
```
---
## Good Example
```sql
ALTER TABLE posts ADD search_vector tsvector
GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || body)) STORED;
CREATE INDEX posts_search_idx ON posts USING GIN(search_vector);
```
---
## Exceptions
Tables under 1,000 records where read-side computation overhead is negligible.
---
## Consequences Of Violation
Slow searches, CPU spikes, poor query performance at scale.

## Specify Correct Text Search Configuration Per Language
---
## Category
Design
---
## Rule
Always specify the correct `regconfig` (language configuration) for each column's content language in `to_tsvector()`.
---
## Reason
Using the default English configuration for non-English content applies wrong stemming rules and stop-word lists, producing incorrect lexemes and poor search results.
---
## Bad Example
```php
// German content using English stemmer
to_tsvector('english', $germanText) // Wrong stemming
```
---
## Good Example
```php
// German content with German configuration
to_tsvector('german', $germanText) // Correct stemming
```
---
## Exceptions
Monolingual English applications where the default configuration is correct.
---
## Consequences Of Violation
Poor search quality, missing results, incorrect stemming for non-English content.

## Use websearch_to_tsquery for User Input
---
## Category
Security
---
## Rule
Always use `websearch_to_tsquery()` instead of `to_tsquery()` when parsing user-provided search input.
---
## Reason
`to_tsquery()` requires strict boolean operator syntax — raw user input causes syntax errors or injection-like behavior. `websearch_to_tsquery()` accepts familiar web-style syntax (quotes, minus signs) safely.
---
## Bad Example
```php
// User types "cat -dog" — to_tsquery() expects strict boolean format
to_tsquery('cat -dog') // Syntax error
```
---
## Good Example
```php
// User types "cat -dog" — websearch_to_tsquery() handles it safely
websearch_to_tsquery('english', 'cat -dog') // Correct: cat & !dog
```
---
## Exceptions
When search input comes from controlled sources (admin panels, API integrations) with pre-validated syntax.
---
## Consequences Of Violation
Syntax errors from user input, potential query manipulation, application crashes.

## Schedule Periodic REINDEX for GIN Indexes
---
## Category
Maintainability
---
## Rule
Always schedule periodic `REINDEX` for GIN indexes on tables with frequent write operations.
---
## Reason
GIN indexes bloat under heavy write load, causing degraded query performance over time. Periodic REINDEX recovers the bloat and restores search performance.
---
## Bad Example
```php
// No REINDEX scheduled — GIN index performance degrades over months
```
---
## Good Example
```php
// Schedule weekly REINDEX for search tables
$schedule->command('db:reindex-search')->weekly();
// Or raw SQL
REINDEX INDEX posts_search_idx;
```
---
## Exceptions
Read-only tables or tables with very low write frequency where bloat is minimal.
---
## Consequences Of Violation
Gradual search performance degradation, increased disk usage, slower queries.
