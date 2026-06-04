## Create FULLTEXT Indexes in Migrations Before Using Engine
---
## Category
Performance
---
## Rule
Always create FULLTEXT (MySQL) or GIN (PostgreSQL) indexes in a migration before enabling Scout's database engine for search.
---
## Reason
Without database-level FULLTEXT/GIN indexes, Scout falls back to `LIKE` queries that are 100-1000x slower on tables over 10K rows. The database engine's performance depends entirely on these indexes.
---
## Bad Example
```php
#[SearchUsingFullText(['title', 'body'])]
// No migration — LIKE fallback, slow queries
```
---
## Good Example
```php
// Migration
Schema::table('posts', function (Blueprint $table) {
    $table->fullText(['title', 'body']); // MySQL
    // Or PostgreSQL: raw GIN index creation
});

// Model
#[SearchUsingFullText(['title', 'body'])]
```
---
## Exceptions
Development environments where search performance is not critical.
---
## Consequences Of Violation
Slow LIKE-based searches, database resource contention, poor user experience.

## Combine Full-Text and Prefix Attributes for Mixed Content
---
## Category
Design
---
## Rule
Always apply both `#[SearchUsingFullText]` and `#[SearchUsingPrefix]` attributes on models containing both text content and identifier fields.
---
## Reason
Full-text search tokenizes identifiers (emails, SKUs) incorrectly. Prefix search on text fields misses interior words. Using both attributes ensures each field type is queried optimally.
---
## Bad Example
```php
#[SearchUsingFullText(['email', 'bio'])]
// Email search tokenizes 'john@example.com' incorrectly
```
---
## Good Example
```php
#[SearchUsingPrefix(['email', 'username'])]
#[SearchUsingFullText(['bio', 'interests'])]
// Each field type uses the correct query strategy
```
---
## Exceptions
Models containing only text content or only identifier fields.
---
## Consequences Of Violation
Poor identifier search results, missed matches on text content.

## Use Read Replicas for Search-Heavy Workloads
---
## Category
Performance
---
## Rule
Always direct search queries to a read replica when using the database engine on high-traffic applications.
---
## Reason
FULLTEXT and GIN search queries compete with transactional queries for database CPU and I/O. Read replicas isolate search load, preventing performance degradation on writes.
---
## Bad Example
```php
// All search queries hit the primary database
// Competes with writes during peak traffic
```
---
## Good Example
```php
// Configure read replica in database config
'mysql_read' => [
    'host' => env('DB_READ_HOST', 'replica.example.com'),
    // ...
]

// Use read connection for search (custom engine or repository)
```
---
## Exceptions
Low-traffic applications where database load is not a concern.
---
## Consequences Of Violation
Write performance degradation, slow API responses, database contention.
