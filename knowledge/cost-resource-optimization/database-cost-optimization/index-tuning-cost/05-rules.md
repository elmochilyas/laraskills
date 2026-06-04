---
## Rule Name
Index Every Foreign Key Column

## Category
Performance

## Rule
Always add `->index()` after `foreignId()` in Laravel migrations. Every column used in an Eloquent relationship `_id` suffix must have a database index.

## Reason
JOINs between tables use foreign keys. Without an index, the database performs a full table scan on the referenced table, making JOINs exponentially slower as tables grow.

## Bad Example
```php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
});
```

## Good Example
```php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->index();
});
```

## Exceptions
Columns with very low cardinality (<10 distinct values) in tables under 10K rows.

## Consequences Of Violation
Every JOIN on the unindexed foreign key does a full table scan. As tables grow, database CPU rises, forcing premature vertical scaling.

---
## Rule Name
Create Composite Indexes for Multi-Column WHERE Filters

## Category
Performance

## Rule
Create composite indexes for queries filtering on multiple columns. Place the highest-cardinality column first in the index definition.

## Reason
MySQL can use only one index per table per query. Separate indexes on `status` and `created_at` mean only one filter benefits. A composite index on `(status, created_at)` covers both.

## Bad Example
```php
// Query: WHERE status = 'active' AND created_at > '2024-01-01'
// Indexes: INDEX(status), INDEX(created_at)
// MySQL uses only one index, scans the rest
```

## Good Example
```php
// Query: WHERE status = 'active' AND created_at > '2024-01-01'
// Index: INDEX(status, created_at)
// Both filters use the composite index
```

## Exceptions
When the second column has very poor cardinality (<5 distinct values) and adding it provides no selectivity gain.

## Consequences Of Violation
Queries scan 10-100x more rows than necessary, increasing database I/O and CPU. This directly translates to higher instance costs.

---
## Rule Name
Monitor and Drop Unused Indexes

## Category
Maintainability

## Rule
Query `sys.schema_unused_indexes` (MySQL) or `pg_stat_user_indexes` (PostgreSQL) monthly. Drop any index with zero scans in 30 days.

## Reason
Unused indexes waste storage space and degrade write performance. Each unused index adds 1-5% overhead to every INSERT, UPDATE, and DELETE.

## Bad Example
Adding 10 composite indexes for every possible query pattern. Write-heavy tables slow down, but nobody checks if all 10 are actually used.

## Good Example
Monthly index usage review. Dropping 4 unused indexes recovers 15% write performance and saves storage.

## Exceptions
Indexes required for specific monthly/quarterly reporting queries that are exercised infrequently by design.

## Consequences Of Violation
Write-heavy tables degrade over time as indexes accumulate. Storage costs rise. INSERT throughput drops without any query benefit.

---
## Rule Name
Prefer Covering Indexes for Hot Queries

## Category
Performance

## Rule
Include all SELECT columns in the index definition for high-traffic queries to create a covering index that eliminates table access entirely.

## Reason
A covering index contains all data needed by the query. The database reads only the index pages, reducing I/O by 90% for buffer-pool-cached queries.

## Bad Example
```php
SELECT title, excerpt FROM posts WHERE status = 'published' AND created_at > '2024-01-01';
// Index: INDEX(status, created_at)
// Database reads index, then reads table for title and excerpt
```

## Good Example
```php
SELECT title, excerpt FROM posts WHERE status = 'published' AND created_at > '2024-01-01';
// Index: INDEX(status, created_at) INCLUDE (title, excerpt)  -- PostgreSQL
// or composite index on (status, created_at, title, excerpt) -- MySQL
```

## Exceptions
When the included columns make the index too large (>50% of table size), the index overhead may outweigh the benefit.

## Consequences Of Violation
Hot queries perform table lookups for every matching row, doubling I/O and consuming more buffer pool memory than necessary.

---
## Rule Name
Use Partial Indexes in PostgreSQL

## Category
Performance

## Rule
Use `CREATE INDEX ... WHERE ...` for PostgreSQL indexes when filtering on a subset of rows. Never index all rows when the query filters to a small fraction.

## Reason
A partial index is a fraction of the size of a full-table index. It uses less storage, generates less write overhead, and scans faster.

## Bad Example
```php
CREATE INDEX ON users (created_at);
// Indexes all users, including 60% that are inactive and rarely queried
```

## Good Example
```php
CREATE INDEX ON users (created_at) WHERE status = 'active';
// Only indexes the 40% of users that are queried
```

## Exceptions
When queries need to scan both active and inactive users with the same filter.

## Consequences Of Violation
Full-table indexes on low-selectivity conditions waste storage and write performance. On a table with 1M rows where only 10% match, the index is 10x larger than needed.

---
## Rule Name
Add Indexes in the Same Migration as Table Creation

## Category
Code Organization

## Rule
Always add index statements in the same migration that creates the table, not in a separate migration. Use explicit, descriptive index names.

## Reason
Adding indexes later requires a separate deployment and locks large tables. Including indexes in the creation migration is instant and atomic.

## Bad Example
```php
// migration 1: creates table without indexes
// migration 2: adds indexes (takes 30 minutes on production with 1M rows)
```

## Good Example
```php
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->index();
    $table->string('status');
    $table->timestamps();
    $table->index(['status', 'created_at'], 'idx_posts_status_created');
});
```

## Exceptions
When the index is added later based on observed query patterns that couldn't be predicted at creation time.

## Consequences Of Violation
Adding indexes post-deployment on large production tables causes table locks and downtime. The migration may take hours on tables >10M rows.

---
## Rule Name
Avoid Indexing Low-Cardinality Columns Alone

## Category
Performance

## Rule
Do not create a standalone index on a column with fewer than 100 distinct values. Only include low-cardinality columns as the second or later position in a composite index.

## Reason
An index on `status` with 3 values (`active`, `inactive`, `deleted`) creates 3 buckets each containing 33% of rows. The optimizer ignores it since a full table scan is cheaper.

## Bad Example
```php
$table->index('status');
// 3 values; optimizer never uses it
```

## Good Example
```php
$table->index(['status', 'created_at']);
// Composite: status filters to 33%, created_at narrows further
```

## Exceptions
PostgreSQL partial indexes on low-cardinality columns with a WHERE clause that reduces the row count significantly.

## Consequences Of Violation
Unused indexes waste write performance and storage. Every INSERT pays the cost, but no query ever benefits.
