## Always Create FULLTEXT Index Before Using SearchUsingFullText
---
## Category
Performance
---
## Rule
Always create FULLTEXT indexes via migration before applying the `#[SearchUsingFullText]` attribute on model columns.
---
## Reason
Without a FULLTEXT index, `SearchUsingFullText` has no effect — MySQL falls back to `LIKE` scans that are 100-1000x slower on tables over 10K rows.
---
## Bad Example
```php
#[SearchUsingFullText(['title', 'body'])]
// No migration creating FULLTEXT indexes — LIKE fallback
```
---
## Good Example
```php
// Migration
Schema::table('posts', function (Blueprint $table) {
    $table->fullText(['title', 'body']);
});

// Model
#[SearchUsingFullText(['title', 'body'])]
```
---
## Exceptions
Development environments where query performance is not critical.
---
## Consequences Of Violation
Extremely slow searches, LIKE table scans, poor user experience.

## Use Boolean Mode to Avoid the 50% Threshold
---
## Category
Reliability
---
## Rule
Always use Boolean Mode (Scout's default) for MySQL FULLTEXT searches; never rely on Natural Language Mode.
---
## Reason
MySQL's Natural Language Mode ignores terms that appear in more than 50% of rows, returning zero results for common terms. Boolean Mode does not have this limitation.
---
## Bad Example
```php
// Natural Language Mode — 'the' appears in >50% of posts
// Search for 'the cat' returns zero results
```
---
## Good Example
```php
// Boolean Mode (Scout default) — 'the cat' returns all matching rows
// WITH QUERY EXPANSION adds related terms from top results
```
---
## Exceptions
When you intentionally need the 50% threshold behavior for specific analytics queries.
---
## Consequences Of Violation
Common search terms returning zero results, user confusion, broken search functionality.

## Configure Minimum Token Size for Short Content
---
## Category
Performance
---
## Rule
Always configure `innodb_ft_min_token_size` when your content contains short search terms (codes, abbreviations, IDs).
---
## Reason
MySQL's default minimum token size is 3 characters. Words shorter than 3 characters (e.g., "ID", "v2", "GT") are not indexed and cannot be found via FULLTEXT search.
---
## Bad Example
```php
// Default innodb_ft_min_token_size=3
// Product 'GT-5' cannot be found by searching 'GT'
```
---
## Good Example
```php
// my.cnf
[mysqld]
innodb_ft_min_token_size=2

// Then rebuild FULLTEXT indexes
```
---
## Exceptions
Content types where no short words need to be searchable.
---
## Consequences Of Violation
Short but important terms not found, broken search for codes/abbreviations.

## Never Rely on LIKE Scans for Production Search
---
## Category
Performance
---
## Rule
Always ensure FULLTEXT indexes exist on searchable columns in production; never rely on MySQL `LIKE` fallback.
---
## Reason
`LIKE` with leading wildcards (`%term%`) performs full table scans — 100-1000x slower than FULLTEXT on large tables, and competes with transactional queries for database resources.
---
## Bad Example
```php
// No FULLTEXT index — Scout falls back to LIKE
// SELECT * FROM posts WHERE title LIKE '%search%' OR body LIKE '%search%'
```
---
## Good Example
```php
// FULLTEXT index exists — Scout uses MATCH...AGAINST
// SELECT * FROM posts WHERE MATCH(title, body) AGAINST('search' IN BOOLEAN MODE)
```
---
## Exceptions
Tables under 1,000 records where LIKE performance is acceptable.
---
## Consequences Of Violation
Slow page loads, database resource contention, timeouts under load.
