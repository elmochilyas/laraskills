# Database Engineering Expert Skill

## When to Use

Use this skill when designing database schemas, optimizing SQL queries, scaling database infrastructure, implementing search features, or working with database-specific capabilities (PostgreSQL or MySQL). This is the definitive reference for database engineering in Laravel 13 applications.

---

## Core Philosophy

### Database-First Thinking

Most performance problems originate from the database layer, not application code:
- Poor schema design
- Missing or incorrect indexes
- Inefficient queries
- Over-fetching data
- N+1 queries
- Incorrect scaling strategy

**Golden Rule:** Never optimize application code before analyzing database performance. Always profile the query first.

---

## 1. SQL Mastery

### 1.1 Select Only Needed Data

```sql
-- BAD
SELECT * FROM users;

-- GOOD
SELECT id, name, email FROM users;
```

### 1.2 Filter Early

```sql
-- BAD — loads all rows into application memory
SELECT * FROM orders;

-- GOOD — database filters before returning
SELECT * FROM orders WHERE status = 'paid';
```

### 1.3 Always Paginate

```sql
-- BAD for large tables
SELECT * FROM orders;

-- GOOD
SELECT * FROM orders ORDER BY id LIMIT 100 OFFSET 0;
```

### 1.4 Common Table Expressions (CTEs)

Use `WITH` queries for complex multi-step logic:

```sql
WITH popular_categories AS (
    SELECT category_id, COUNT(*) as total
    FROM products
    WHERE is_published = true
    GROUP BY category_id
    HAVING COUNT(*) > 10
)
SELECT c.name, pc.total
FROM categories c
JOIN popular_categories pc ON pc.category_id = c.id
ORDER BY pc.total DESC;
```

**Laravel query builder:**

```php
$results = DB::table('categories')
    ->select('categories.name', 'pc.total')
    ->join(
        DB::raw('(SELECT category_id, COUNT(*) as total FROM products WHERE is_published = true GROUP BY category_id HAVING COUNT(*) > 10) as pc'),
        'pc.category_id', '=', 'categories.id'
    )
    ->orderBy('pc.total', 'desc')
    ->get();
```

### 1.5 Window Functions

```sql
SELECT
    id,
    title,
    category_id,
    ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY created_at DESC) as rn,
    RANK() OVER (ORDER BY views DESC) as view_rank,
    LAG(created_at) OVER (ORDER BY created_at) as previous_post_date,
    LEAD(created_at) OVER (ORDER BY created_at) as next_post_date
FROM posts;
```

### 1.6 Recursive CTEs

For hierarchical data (categories, org charts):

```sql
WITH RECURSIVE category_tree AS (
    SELECT id, name, parent_id, 1 as depth
    FROM categories
    WHERE parent_id IS NULL
    UNION ALL
    SELECT c.id, c.name, c.parent_id, ct.depth + 1
    FROM categories c
    JOIN category_tree ct ON ct.id = c.parent_id
)
SELECT * FROM category_tree ORDER BY depth, name;
```

### 1.7 UNION / INTERSECT / EXCEPT

```sql
-- Users who are either admins or have placed an order
SELECT id, name FROM users WHERE is_admin = true
UNION
SELECT DISTINCT u.id, u.name FROM users u JOIN orders o ON o.user_id = u.id;

-- Users who are in both sets (INTERSECT) or in one but not the other (EXCEPT)
```

### 1.8 RETURNING Clause

Return data from INSERT/UPDATE/DELETE without a second query. **PostgreSQL** supports `RETURNING` natively:

```sql
INSERT INTO orders (user_id, total) VALUES (1, 5000) RETURNING id, created_at;

UPDATE orders SET status = 'paid' WHERE id = 100 RETURNING *;

DELETE FROM sessions WHERE expires_at < NOW() RETURNING user_id;
```

**MySQL** does not support `RETURNING`. Use `lastInsertId()` or `insertGetId()` instead:

```php
$id = DB::table('orders')->insertGetId([
    'user_id' => 1, 'total' => 5000
]);
// $id holds the auto-increment value

// For UPDATE/DELETE — re-select after the operation
DB::table('orders')->where('id', 100)->update(['status' => 'paid']);
$order = DB::table('orders')->find(100);
```

### 1.9 UPSERT (INSERT ON CONFLICT)

```sql
INSERT INTO users (email, name)
VALUES ('john@example.com', 'John')
ON CONFLICT (email)
DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

-- Laravel query builder
DB::table('users')->upsert(
    ['email' => 'john@example.com', 'name' => 'John'],
    'email',
    ['name', 'updated_at']
);
```

### 1.10 GROUP BY Extensions

```sql
-- ROLLUP — subtotals for each level (PostgreSQL + MySQL 8.0+)
SELECT category_id, status, COUNT(*), SUM(amount)
FROM orders
GROUP BY ROLLUP (category_id, status);

-- CUBE — subtotals for all combinations (PostgreSQL only)
SELECT category_id, status, COUNT(*)
FROM orders
GROUP BY CUBE (category_id, status);

-- GROUPING SETS — explicit grouping combinations (PostgreSQL only)
SELECT category_id, status, COUNT(*)
FROM orders
GROUP BY GROUPING SETS ((category_id), (status), ());
```

**MySQL** supports only `ROLLUP` (not `CUBE` or `GROUPING SETS`). Use application code or multiple queries as a workaround.

---

## 2. Query Plans & Execution Plans

### 2.1 Using EXPLAIN

Every critical query must be analyzed before deployment:

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 1;

EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 1;
```

`EXPLAIN ANALYZE` actually executes the query and shows real timings. Use on a replica or with a `SELECT COUNT(*)` variant in production.

**MySQL** also supports `EXPLAIN ANALYZE` (MySQL 8.0.18+). For detailed output, use `EXPLAIN FORMAT=JSON` to get machine-readable plans with cost estimates, and `SHOW WARNINGS` to see the rewritten query.

**In Laravel:**

```php
// Enable query log
DB::enableQueryLog();

// Run query
$orders = Order::where('user_id', 1)->get();

// Dump queries
dump(DB::getQueryLog());

// Or use Telescope / Debugbar in development
```

### 2.2 Reading Execution Plans

Key columns to check:

| Column | What to look for |
|--------|-----------------|
| **Seq Scan** | Bad on large tables — missing index |
| **Index Scan** | Good — using index |
| **Index Only Scan** | Best — covering index, no table access |
| **Bitmap Index Scan** | Acceptable for large result sets |
| **Nested Loop** | Expensive if inner scan is large |
| **Hash Join** | Good for large joins |
| **Merge Join** | Good if inputs are sorted |
| **Sort (External Merge)** | Bad — sorting on disk, increase `work_mem` |
| **Actual Time** | Compare to expected — high means slow I/O |
| **Rows** | If estimated ≠ actual, ANALYZE the table |
| **Buffers** | High shared hit means cold cache; high shared read means disk I/O |

### 2.3 Common Problems

**Sequential scan on large table:**
```
Seq Scan on orders  (cost=0.00..43210.00 rows=1000 width=40)
```
Fix: Add an index on the filtered column.

**Sort spilling to disk:**
```
Sort Method: external merge  Disk: 1234kB
```
Fix: Increase `work_mem` in postgresql.conf, or add an index that provides the sort order.

**Row estimate mismatch:**
```
Rows Removed by Filter: 1000000
```
Fix: Run `ANALYZE` to update table statistics.

**Nested loop on large dataset:**
```
Nested Loop  (cost=0.00..50000.00 rows=50000)
```
Fix: Increase `random_page_cost` to prefer hash joins, or add indexes.

---

## 3. Index Design

### 3.1 Indexing Rules

```sql
-- Index foreign keys (required)
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Index search columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_uuid ON users(uuid);

-- Index frequently filtered columns
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

**Do not over-index.** Every index:
- Consumes storage
- Slows INSERT operations
- Slows UPDATE operations (index maintenance)

Only index proven query patterns. Use `pg_stat_user_indexes` to find unused indexes.

### 3.2 Composite Indexes

**Column order matters.** Match the query filter order (left-most rule):

```sql
-- Query:
WHERE tenant_id = ? AND status = ? AND created_at > ?

-- Index:
CREATE INDEX idx_orders_tenant_status_date ON orders(tenant_id, status, created_at);
```

The database can use prefix combinations:
- `tenant_id` ✓
- `tenant_id, status` ✓
- `tenant_id, status, created_at` ✓
- `status` only ✗ (cannot skip left-most column)

### 3.3 Partial Indexes

Index only the subset of rows that matter:

```sql
-- Only index active users (excludes 80% of rows)
CREATE INDEX idx_active_users ON users(id) WHERE active = true;

-- Only index pending orders
CREATE INDEX idx_pending_orders ON orders(created_at) WHERE status = 'pending';
```

Benefits: smaller indexes, faster scans, lower maintenance.

### 3.4 Covering Indexes

Include all columns needed by the query to avoid table access:

```sql
-- Query:
SELECT id, name, email FROM users WHERE email = ?;

-- Covering index (PostgreSQL)
CREATE INDEX idx_users_email_covering ON users(email) INCLUDE (id, name);
```

This enables **Index Only Scans** — the database never touches table rows.

### 3.5 Expression / Functional Indexes

```sql
-- Index on lowercased email for case-insensitive search
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- Index on JSONB field value
CREATE INDEX idx_products_metadata_price ON products(((metadata->>'price')::numeric));
```

### 3.6 Index Maintenance

```sql
-- Find unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Find index bloat (approximate)
SELECT
    schemaname, tablename, indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- Rebuild bloated index
REINDEX INDEX CONCURRENTLY idx_orders_created_at;

-- Update table statistics for query planner
ANALYZE orders;
```

### 3.7 Index Types

**PostgreSQL:**

| Index Type | Best For |
|------------|----------|
| **B-tree** (default) | Equality and range queries, sorting |
| **GIN** | JSONB, arrays, full-text search, vector search metadata |
| **GiST** | Full-text search, geometric data, range types |
| **BRIN** | Very large tables with naturally ordered data (logs, events) |
| **HASH** | Equality queries only (rarely needed) |
| **HNSW** | Vector similarity search (pgvector) |

**MySQL (InnoDB):**

| Index Type | Best For |
|------------|----------|
| **B-tree** (default) | All queries (InnoDB always uses B-tree) |
| **FULLTEXT** | Full-text search on CHAR/VARCHAR/TEXT columns |
| **SPATIAL** | Geographic/spatial data (POINT, LINESTRING, POLYGON) |
| **HASH** | MEMORY engine only — equality lookups |
| **Descending** `(col DESC)` | Mixed-order sorts on composite indexes (MySQL 8.0+) |
| **Functional** `((expr))` | Index on expressions like `LOWER(col)` (MySQL 8.0.13+) |
| **Invisible** `INVISIBLE` | Drop without risk — test impact before making visible (MySQL 8.0+) |

**MySQL does not support:** partial/conditional indexes (`WHERE` clause), `INCLUDE` columns, GIN/GiST/BRIN.

For MySQL, emulate partial indexes with a **generated column**:

```sql
ALTER TABLE users ADD COLUMN is_active tinyint(1) GENERATED ALWAYS AS (status = 'active') VIRTUAL;
CREATE INDEX idx_active_users ON users(is_active) WHERE is_active = 1;
-- MySQL: just use a conditional index on the generated column
```

Actually MySQL cannot do WHERE in CREATE INDEX. Use a generated column approach:

```sql
ALTER TABLE users ADD COLUMN is_active_key tinyint(1) GENERATED ALWAYS AS (IF(status = 'active', 1, NULL)) VIRTUAL;
CREATE INDEX idx_active_users ON users(is_active_key);
-- Only matches when status = 'active', filtering NULLs implicitly
```

---

## 4. Full-Text Search

### 4.1 Database Full-Text Search

Laravel's `whereFullText` works on MariaDB, MySQL, and PostgreSQL with native full-text indexes:

```php
// Migration
Schema::create('articles', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->text('body');
    $table->timestamps();
    $table->fullText(['title', 'body']);
});

// PostgreSQL language configuration
$table->fullText('body')->language('english');

// Query
$articles = Article::whereFullText('body', 'web developer')->get();

// Multi-column
$articles = Article::whereFullText(['title', 'body'], 'web developer')->get();

// OR condition
$articles = Article::whereFullText('title', 'php')
    ->orWhereFullText('body', 'laravel')
    ->get();
```

On MySQL/MariaDB, results auto-order by relevance. On PostgreSQL, use Scout's database engine for relevance ordering.

**MySQL full-text search specifics:**

```php
// BOOLEAN MODE — operators (+ required, - excluded, * wildcard)
$articles = Article::whereRaw(
    'MATCH(title, body) AGAINST(? IN BOOLEAN MODE)',
    ['+web +developer -javascript']
)->get();

// WITH QUERY EXPANSION — finds related documents (fuzzy)
$articles = Article::whereRaw(
    'MATCH(title, body) AGAINST(? WITH QUERY EXPANSION)',
    ['laravel framework']
)->get();
```

MySQL full-text has minimum word length limits (`innodb_ft_min_token_size` for InnoDB, default 3) — single-letter or two-letter terms are ignored. Use `%term%` `LIKE` as fallback for very short search terms.

### 4.2 Laravel Scout Database Engine

```php
use Laravel\Scout\Attributes\SearchUsingFullText;
use Laravel\Scout\Attributes\SearchUsingPrefix;
use Laravel\Scout\Searchable;

class Article extends Model
{
    use Searchable;

    #[SearchUsingPrefix(['id'])]
    #[SearchUsingFullText(['title', 'body'])]
    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
        ];
    }
}

// Search
$articles = Article::search('Laravel')->get();
```

### 4.3 Raw SQL Full-Text Search (PostgreSQL)

```sql
-- Create tsvector column for performance
ALTER TABLE articles ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))) STORED;

-- Index it with GIN
CREATE INDEX articles_search_idx ON articles USING gin(search_vector);

-- Query
SELECT title, ts_rank(search_vector, query) as rank
FROM articles, plainto_tsquery('english', 'web developer') query
WHERE search_vector @@ query
ORDER BY rank DESC;
```

---

## 5. Database Scaling

### 5.1 Read Replicas

Separate reads from writes:

```php
// config/database.php (same pattern works for 'pgsql')
'pgsql' => [
    'driver' => 'pgsql',
    'write' => [
        'host' => env('DB_HOST_WRITE', '127.0.0.1'),
    ],
    'read' => [
        'host' => [
            env('DB_HOST_REPLICA_1', '127.0.0.1'),
            env('DB_HOST_REPLICA_2', '127.0.0.1'),
        ],
    ],
    // ...
],
```

Laravel automatically uses `read` connections for SELECT queries and `write` for INSERT/UPDATE/DELETE. Load balancing across replicas is handled randomly.

**Warning:** Replication lag exists. Never read from replicas when immediately consistent reads are required (e.g., show the user their just-created order).

**Use replicas for:**
- Dashboards
- Reporting
- Analytics
- Search indexing
- Background jobs

### 5.2 Table Partitioning

Split one table into logical segments for better query performance and easier maintenance:

```php
// Migration — range partitioning (PostgreSQL syntax)
DB::statement("
    CREATE TABLE orders (
        id BIGSERIAL,
        user_id BIGINT NOT NULL,
        total INT NOT NULL,
        created_at TIMESTAMP NOT NULL
    ) PARTITION BY RANGE (created_at);
");

DB::statement("
    CREATE TABLE orders_2024 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
");

DB::statement("
    CREATE TABLE orders_2025 PARTITION OF orders
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
");

DB::statement("
    CREATE TABLE orders_2026 PARTITION OF orders
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
");
```

**MySQL partitioning syntax is different** — partitions are defined inline within `CREATE TABLE`:

```php
DB::statement("
    CREATE TABLE orders (
        id BIGINT UNSIGNED AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        total INT NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id, created_at)
    ) PARTITION BY RANGE (YEAR(created_at)) (
        PARTITION p2024 VALUES LESS THAN (2025),
        PARTITION p2025 VALUES LESS THAN (2026),
        PARTITION p2026 VALUES LESS THAN (2027),
        PARTITION p_future VALUES LESS THAN MAXVALUE
    );
");
```

Note: MySQL requires the partition key to be part of any unique/primary key. Supported partition types: `RANGE`, `LIST`, `HASH`, `KEY`, `RANGE COLUMNS`, `LIST COLUMNS`, and subpartitioning.

**Best for:** Logs, events, analytics, audit records — time-series data.

**Partition types:**
- **RANGE** — by date, ID range
- **LIST** — by region, status, category
- **HASH** — evenly distribute data across partitions

**Benefits:** Faster queries (partition pruning), easier maintenance, faster archiving (DROP PARTITION instead of DELETE).

### 5.3 Sharding

Split data across databases. Only use when a single database is no longer sufficient:

```text
Tenant A → DB1
Tenant B → DB2
Tenant C → DB3
```

**Sharding increases complexity and operational costs.** Use only when necessary.

**Good sharding keys:** `tenant_id`, `customer_id`, `organization_id`
**Bad sharding keys:** `country`, `status` (skew)

### 5.4 Connection Pooling

**PostgreSQL** — use PgBouncer in transaction mode:

```text
Laravel workers → PgBouncer (transaction mode) → PostgreSQL
```

PgBouncer reduces PostgreSQL connection overhead and prevents connection exhaustion.

**MySQL** — use ProxySQL:

```text
Laravel workers → ProxySQL → MySQL (primary + replicas)
```

ProxySQL provides connection pooling, query routing (read/write split), query caching, and firewall rules. It can also rewrite queries and enforce query rules without application changes.

### 5.5 Horizontal Scaling Requirements

Applications must be stateless. Do not store sessions, cache, or files on local servers:
- Sessions → Redis
- Cache → Redis / Memcached
- Files → S3 / GCS / local with shared mount

---

## 6. Multi-Tenant Databases

### 6.1 Tenant Strategies

| Strategy | Isolation | Complexity | Cost |
|----------|-----------|------------|------|
| Shared database (`tenant_id` column) | Low | Low | Low |
| Schema per tenant (`tenant_a.users`) | Medium | Medium | Medium |
| Database per tenant | High | High | High |

**Recommendation:** Start with shared database + `tenant_id` column. Move to schema or database per tenant only when isolation requirements demand it.

### 6.2 Shared Database Approach

```php
// Global scope for tenant isolation
class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $builder->where('tenant_id', tenant()->id);
    }
}

#[ScopedBy(TenantScope::class)]
class Order extends Model {}
```

### 6.3 Tenant-Aware Migrations

```php
// Run migration per tenant schema
foreach (Tenant::all() as $tenant) {
    $tenant->configureConnection();
    Artisan::call('migrate', [
        '--database' => 'tenant',
        '--path' => 'database/migrations/tenant',
    ]);
}
```

---

## 7. Transactions

### 7.1 Basic Transactions

Every operation modifying multiple entities must be transactional:

```php
// BAD — partial failure possible
Order::create([...]);
Payment::create([...]);
Invoice::create([...]);

// GOOD — atomic
DB::transaction(function () {
    $order = Order::create([...]);
    Payment::create(['order_id' => $order->id, ...]);
    Invoice::create(['order_id' => $order->id, ...]);
});
```

### 7.2 Nested Transactions (Savepoints)

Laravel's `DB::transaction()` creates savepoints when nested:

```php
DB::transaction(function () {
    Order::create([...]);

    DB::transaction(function () {
        // Savepoint created — inner failure rolls back to savepoint
        Payment::create([...]);
    });
});
```

**Avoid deep nesting (3+ levels).** Use service orchestration instead.

### 7.3 Pessimistic Locking

Prevent race conditions on shared resources:

```php
// Lock for update — blocks other writes until transaction completes
DB::transaction(function () use ($productId, $quantity) {
    $product = Product::lockForUpdate()->find($productId);

    if ($product->stock < $quantity) {
        throw new InsufficientStockException();
    }

    $product->decrement('stock', $quantity);
    Order::create(['product_id' => $productId, 'quantity' => $quantity]);
});

// Shared lock — prevents row modification, allows concurrent reads
$product = Product::sharedLock()->find($productId);

// SKIP LOCKED — skip locked rows instead of waiting (MySQL 8.0+, PostgreSQL 9.5+)
$nextJob = Job::lockForUpdate()->skipLocked()->first();

// NOWAIT — fail immediately if row is locked (MySQL 8.0+, PostgreSQL 9.5+)
$product = Product::lockForUpdate()->nowait()->find($productId);
```

**MySQL InnoDB locking specifics:**

MySQL InnoDB uses **next-key locks** (record lock + gap lock) in `REPEATABLE READ` to prevent phantom reads. This means `SELECT ... WHERE id > 100 FOR UPDATE` may lock a range, not just matching rows. Use `READ COMMITTED` isolation in MySQL to reduce gap locking:

```php
// Reduce gap locking in MySQL by using READ COMMITTED
DB::statement('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED');

DB::transaction(function () {
    // No gap locks — more concurrency, fewer deadlocks
    $orders = Order::lockForUpdate()->where('status', 'pending')->get();
});
```

### 7.4 Deadlock Prevention

**Always acquire locks in a consistent order across all transactions:**

```php
// BAD — Transaction A locks Users→Orders, Transaction B locks Orders→Users
// These two transactions can deadlock.

// GOOD — always lock in the same order
// Both transactions: Users → Orders
DB::transaction(function () {
    $user = User::lockForUpdate()->find($userId);
    $order = Order::lockForUpdate()->find($orderId);
    // ...
});
```

### 7.5 Retry Mechanisms

```php
// Laravel's built-in retry for deadlocks
DB::transaction(function () {
    // Your transactional logic
}, attempts: 5);

// Manual retry with exponential backoff
foreach ([100, 200, 400, 800, 1600] as $delay) {
    try {
        DB::beginTransaction();
        // ...
        DB::commit();
        break;
    } catch (DeadlockException $e) {
        DB::rollBack();
        usleep($delay * 1000);
    }
}
```

**Retry eligible errors:** deadlocks, lock wait timeout, serialization failures, temporary network errors.
**Never retry:** validation errors, business rule violations, constraint violations.

### 7.6 Isolation Levels

```php
// Laravel sets READ COMMITTED by default

// Set isolation level for a session
DB::statement('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');

DB::transaction(function () {
    // This transaction uses REPEATABLE READ
});
```

| Level | Dirty Read | Non-repeatable Read | Phantom Read | Performance |
|-------|-----------|---------------------|--------------|-------------|
| Read Uncommitted | Possible | Possible | Possible | Best |
| Read Committed | Safe | Possible | Possible | Good |
| Repeatable Read | Safe | Safe | Possible | Moderate |
| Serializable | Safe | Safe | Safe | Slowest |

**Use READ COMMITTED for most workloads (default in PostgreSQL).**
**Use REPEATABLE READ for financial calculations where consistent snapshots matter (default in MySQL).**

**MySQL vs PostgreSQL isolation defaults:** MySQL defaults to `REPEATABLE READ` for InnoDB. PostgreSQL defaults to `READ COMMITTED`. MySQL's `REPEATABLE READ` uses gap locks to prevent phantom reads — this increases deadlock risk in high-concurrency scenarios. Consider switching MySQL to `READ COMMITTED` for better concurrency.

**Use SERIALIZABLE only when absolutely necessary** — it has the highest failure rate due to serialization conflicts.

### 7.7 Optimistic Locking

For high-concurrency scenarios with low contention, use an `updated_at` check to detect stale updates:

```php
class Product extends Model
{
    // Use a version column or rely on updated_at
    public function scopeLockVersion(Builder $query, string $column, $value): Builder
    {
        return $query->where($column, $value);
    }
}

// Usage — retry on conflict
$attempts = 0;
$maxAttempts = 3;

while ($attempts < $maxAttempts) {
    try {
        $product = Product::find($productId);
        $originalUpdatedAt = $product->updated_at;

        $product->decrement('stock', $quantity);

        // Only update if updated_at hasn't changed since we loaded it
        $affected = Product::where('id', $productId)
            ->where('updated_at', $originalUpdatedAt)
            ->update(['stock' => $product->stock]);

        if ($affected === 0) {
            throw new \RuntimeException('Record was modified by another process');
        }

        break;
    } catch (\RuntimeException $e) {
        $attempts++;
        if ($attempts >= $maxAttempts) throw $e;
        usleep(100 * 1000); // 100ms delay before retry
    }
}
```

---

## 8. PostgreSQL Engineering

PostgreSQL is the recommended default database for modern Laravel systems.

### 8.1 Laravel PostgreSQL Configuration

```php
// config/database.php
'pgsql' => [
    'driver' => 'pgsql',
    'url' => env('DB_URL'),
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '5432'),
    'database' => env('DB_DATABASE', 'forge'),
    'username' => env('DB_USERNAME', 'forge'),
    'password' => env('DB_PASSWORD', ''),
    'charset' => 'utf8',
    'prefix' => '',
    'prefix_indexes' => true,
    'search_path' => 'public',
    'sslmode' => 'prefer',
],
```

### 8.2 JSONB

Use JSONB for semi-structured data that doesn't warrant a relational model:

```php
// Migration
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->jsonb('metadata'); // JSONB column
    $table->timestamps();
});

// Storing
$product->metadata = ['color' => 'red', 'weight' => 1.5, 'tags' => ['sale', 'new']];
$product->save();

// Querying JSONB
$products = Product::where('metadata->color', 'red')->get();
$products = Product::where('metadata->weight', '>', 1.0)->get();

// JSON containment query
$products = Product::whereRaw("metadata @> '{\"color\": \"red\"}'")->get();

// JSON key existence
$products = Product::whereRaw("metadata ? 'color'")->get();
```

**JSONB GIN index:**

```php
// Migration
DB::statement('CREATE INDEX idx_products_metadata ON products USING gin(metadata)');

// Or for specific JSONB paths only
DB::statement('CREATE INDEX idx_products_metadata_color ON products USING gin((metadata -> \'color\'))');
```

**Rules:**
- Store dynamic attributes that vary per record
- Do not replace proper relational design for core data
- Index with GIN for query performance
- JSONB has overhead — keep individual documents under 100KB

### 8.3 Materialized Views

Precompute expensive queries for fast reads:

```php
// Migration
DB::statement("
    CREATE MATERIALIZED VIEW mv_daily_revenue AS
    SELECT
        DATE(created_at) as day,
        COUNT(*) as order_count,
        SUM(total) as revenue
    FROM orders
    WHERE status = 'paid'
    GROUP BY DATE(created_at)
    ORDER BY day DESC
    WITH DATA;
");

// Create unique index for concurrent refresh
DB::statement("
    CREATE UNIQUE INDEX idx_mv_daily_revenue_day
    ON mv_daily_revenue(day);
");

// Refresh (concurrent — doesn't lock reads)
DB::statement("REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue");

// Query the materialized view
$revenue = DB::table('mv_daily_revenue')
    ->where('day', '>=', now()->subDays(30))
    ->get();
```

**Use for:** dashboards, analytics reports, statistics, aggregation-heavy queries.
**Tradeoff:** Data is stale until refreshed. Schedule refresh via cron or queued job.

### 8.4 PostgreSQL Data Types

```php
// UUID primary key
Schema::create('tenants', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name');
    $table->timestamps();
});

// Array column
Schema::create('articles', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->text('body');
    $table->addColumn('text[]', 'tags')->nullable(); // text array
    // or use raw SQL:
    // DB::statement("ALTER TABLE articles ADD COLUMN tags text[]");
});

// Range type
Schema::table('bookings', function (Blueprint $table) {
    // tsrange — timestamp range
    $table->addColumn('tsrange', 'booking_period');
});
```

### 8.5 Triggers (Use Sparingly)

```php
// Migration — audit trigger
DB::statement("
    CREATE OR REPLACE FUNCTION audit_order_changes()
    RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO order_audit(order_id, old_status, new_status, changed_by, changed_at)
        VALUES (OLD.id, OLD.status, NEW.status, current_user, NOW());
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
");

DB::statement("
    CREATE TRIGGER trg_order_audit
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION audit_order_changes();
");
```

**Allowed uses:** audit logging, change tracking, data synchronization, computed column updates.
**Forbidden:** business workflows, external API calls, payment processing.

### 8.6 Functions & Stored Procedures

```php
// Function
DB::statement("
    CREATE OR REPLACE FUNCTION calculate_order_total(order_id BIGINT)
    RETURNS INT AS $$
    DECLARE
        total INT;
    BEGIN
        SELECT COALESCE(SUM(price * quantity), 0) INTO total
        FROM order_items WHERE order_id = $1;
        RETURN total;
    END;
    $$ LANGUAGE plpgsql;
");

// Call from Laravel
$total = DB::selectOne("SELECT calculate_order_total(?) as total", [$orderId])->total;
```

**Use sparingly.** Keep domain logic in application code. Functions are acceptable for:
- Complex calculations that would be slow in PHP
- Reusable database-level operations
- Bulk data processing

---

## 9. MySQL Engineering

MySQL remains a top choice for many Laravel projects. While PostgreSQL is recommended for new systems, MySQL (InnoDB) is battle-tested and excels in specific scenarios. This section covers MySQL-specific features, syntax differences, and best practices.

### 9.1 MySQL vs PostgreSQL Decision Guide

| Factor | MySQL (InnoDB) | PostgreSQL |
|--------|---------------|-----------|
| Default isolation | REPEATABLE READ | READ COMMITTED |
| JSON support | JSON column (binary optimized) | JSONB (decomposed binary) |
| Full-text search | Built-in, BOOLEAN/QUERY EXPANSION modes | Built-in, tsvector/tsquery |
| Vector search | Not natively supported | Native via pgvector |
| CTEs/Window functions | MySQL 8.0+ | Since 8.4 (2005) |
| Recursive CTEs | MySQL 8.0+ | Since 8.4 |
| Partial indexes | No (use generated columns) | Yes (WHERE clause) |
| Covering indexes | Composite index with all columns | INCLUDE clause |
| Concurrent index builds | No (blocks writes) | Yes (CONCURRENTLY) |
| Materialized views | No (use triggers/events) | Yes (REFRESH CONCURRENTLY) |
| GIN/GiST/BRIN indexes | No | Yes |
| Table partitioning | RANGE/LIST/HASH/KEY | RANGE/LIST/HASH |
| Connection pooling | ProxySQL (external) | PgBouncer (external) |
| Replication | Async/semi-sync/Group Replication | Streaming/logical replication |
| GIS/Spatial | Good | Excellent (PostGIS) |
| Memory footprint | Lower | Higher |
| Use case | Read-heavy, simple workloads | Data integrity, complex queries, analytics |

**Choose MySQL when:** you need a simple, proven database with lower operational overhead; your queries are simple CRUD; the team has deep MySQL expertise; you rely on managed MySQL (RDS, Aurora, PlanetScale).

**Choose PostgreSQL when:** you need advanced querying (CTEs, window functions, partial indexes, GIN), JSONB for flexible schemas, vector search, materialized views, or strong data integrity guarantees.

### 9.2 Laravel MySQL Configuration

```php
// config/database.php
'mysql' => [
    'driver' => 'mysql',
    'url' => env('DB_URL'),
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '3306'),
    'database' => env('DB_DATABASE', 'forge'),
    'username' => env('DB_USERNAME', 'forge'),
    'password' => env('DB_PASSWORD', ''),
    'unix_socket' => env('DB_SOCKET', ''),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'prefix_indexes' => true,
    'engine' => 'InnoDB',
    'strict' => true,
    'modes' => [
        'ONLY_FULL_GROUP_BY',
        'STRICT_TRANS_TABLES',
        'NO_ZERO_IN_DATE',
        'NO_ZERO_DATE',
        'ERROR_FOR_DIVISION_BY_ZERO',
        'NO_ENGINE_SUBSTITUTION',
    ],
],
```

**Key settings explained:**
- `charset: utf8mb4` — supports all Unicode characters including emoji (use `utf8mb4`, not `utf8` which is only 3-byte)
- `collation: utf8mb4_unicode_ci` — modern Unicode collation. For MySQL 8.0+, prefer `utf8mb4_0900_ai_ci` (based on UCA 9.0, more accurate)
- `engine: InnoDB` — the only production-safe engine for Laravel (supports transactions, foreign keys, row-level locking)
- `strict: true` — enables strict SQL mode (always enable in production)
- `modes` — explicitly set SQL modes for consistent behavior across environments

**Read replicas:**

```php
'mysql' => [
    'driver' => 'mysql',
    'write' => [
        'host' => env('DB_HOST_WRITE', '127.0.0.1'),
    ],
    'read' => [
        'host' => [
            env('DB_HOST_REPLICA_1', '127.0.0.1'),
        ],
    ],
    'sticky' => true, // Read your own writes within the same request
    // ...
],
```

### 9.3 Character Sets & Collations

**Always use `utf8mb4`** — the MySQL `utf8` alias is 3-byte UTF-8 and cannot store emoji or CJK characters:

```php
// Migration
Schema::create('articles', function (Blueprint $table) {
    $table->id();
    $table->string('title', 200); // Varchar(200) in utf8mb4
    $table->text('body');
    $table->timestamps();
    $table->charset = 'utf8mb4';
    $table->collation = 'utf8mb4_unicode_ci';
});

// Database-level default
DB::statement('ALTER DATABASE ' . env('DB_DATABASE') . ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
```

**Collation comparison:**
| Collation | Pros | Cons |
|-----------|------|------|
| `utf8mb4_unicode_ci` | Wide support, good accuracy | Slightly slower than `general_ci` |
| `utf8mb4_general_ci` | Faster sorting (old apps) | Less accurate Unicode sorting |
| `utf8mb4_0900_ai_ci` | Most accurate (MySQL 8.0+) | Not compatible with MySQL 5.7 |

**Performance caution:** `utf8mb4` uses up to 4 bytes per character. Index key length limits may bite you — a `VARCHAR(255)` column indexed in `utf8mb4` uses 1020 bytes (255 × 4). MySQL's max index key length is 3072 bytes for InnoDB. Keep indexed varchar columns under 191 characters to fit within the limit, or specify a prefix length:

```php
// Prefix index — only index first N characters
Schema::table('articles', function (Blueprint $table) {
    $table->index(DB::raw('title(100)'));
});
```

### 9.4 Storage Engine: InnoDB

Laravel requires InnoDB for transactional integrity. Key InnoDB internals:

```php
// Check engine
DB::statement("SHOW TABLE STATUS WHERE Name = 'orders'");

// InnoDB buffer pool — your most important MySQL config
// Set to 70-80% of available RAM for dedicated DB servers
// my.cnf: innodb_buffer_pool_size = 12G
```

**InnoDB buffer pool** caches data and indexes in memory. Monitor it:

```sql
-- Buffer pool hit rate (should be >99% for production)
SELECT (1 - (SUM(innodb_buffer_pool_reads) / NULLIF(SUM(innodb_buffer_pool_read_requests), 0))) * 100 AS hit_rate
FROM performance_schema.global_status
WHERE variable_name IN ('Innodb_buffer_pool_reads', 'Innodb_buffer_pool_read_requests');

-- Current buffer pool size
SELECT @@innodb_buffer_pool_size / 1024 / 1024 / 1024 AS buffer_pool_gb;
```

**InnoDB redo log** (`ib_logfile`): for crash recovery. Set `innodb_log_file_size` large enough to handle peak write workloads (typically 1-4GB for production).

### 9.5 MySQL Index Design Specifics

**Composite index column order (leftmost prefix rule):**

```sql
-- Index:
CREATE INDEX idx_orders_tenant_status_date ON orders(tenant_id, status, created_at);

-- Can use:
WHERE tenant_id = ?                                  -- ✓ (prefix)
WHERE tenant_id = ? AND status = ?                   -- ✓ (prefix)
WHERE tenant_id = ? AND status = ? AND created_at > ? -- ✓ (full)
WHERE status = ?                                      -- ✗ (skipped tenant_id)
WHERE created_at > ?                                  -- ✗ (skipped tenant_id)
```

Same leftmost rule as PostgreSQL B-tree, but MySQL **cannot** do index skip scans (MySQL 8.0.13+ introduced limited skip scan for single-range queries — still less capable than PostgreSQL).

**Descending indexes:**

```sql
-- MySQL 8.0+ supports DESC in index (useful for mixed-order sorts)
CREATE INDEX idx_users_name_age ON users(name ASC, age DESC);

-- Query that benefits:
SELECT * FROM users ORDER BY name ASC, age DESC;
```

**Invisible indexes:**

```sql
-- Test index removal impact without dropping
ALTER TABLE orders ALTER INDEX idx_old_index INVISIBLE;

-- If performance degrades, make it visible again
ALTER TABLE orders ALTER INDEX idx_old_index VISIBLE;
```

**Functional indexes (MySQL 8.0.13+):**

```sql
-- Index on expression
CREATE INDEX idx_users_lower_email ON users((LOWER(email)));
SELECT * FROM users WHERE LOWER(email) = 'john@example.com'; -- Uses index
```

**Multi-valued indexes (MySQL 8.0.17+):**

```sql
-- Index on JSON array values
CREATE INDEX idx_product_tags ON products((CAST(tags AS UNSIGNED ARRAY)));
-- Supports: WHERE JSON_CONTAINS(tags, CAST('[1,2,3]' AS JSON))
```

**MySQL does NOT support:**
- `INCLUDE` columns (use composite index instead — add all needed columns)
- Partial/conditional indexes (`WHERE` clause in `CREATE INDEX`)
- GIN/GiST/BRIN index types

**Covering indexes in MySQL** — achieved by adding all query columns to the index:

```sql
-- Query:
SELECT id, name, email FROM users WHERE email = ?;

-- Covering composite index (all columns in index tree)
CREATE INDEX idx_users_email_covering ON users(email, id, name);
-- Still uses B-tree (no INCLUDE), but avoids table access
```

### 9.6 MySQL JSON Support

MySQL 8.0+ has a native JSON column type (stored as binary JSON internally, not plain text):

```php
// Migration
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->json('metadata'); // JSON column
    $table->timestamps();
});

// Storing
$product->metadata = ['color' => 'red', 'weight' => 1.5, 'tags' => ['sale', 'new']];
$product->save();

// Querying JSON with path expressions (MySQL uses -> and ->>)
$products = Product::where('metadata->color', 'red')->get();
$products = Product::where('metadata->weight', '>', 1.0)->get();

// Extracted as JSON (->) or as string (->>)
$color = DB::scalar("SELECT metadata->>'$.color' FROM products WHERE id = ?", [$id]);

// JSON path matching
$products = Product::whereRaw("JSON_EXTRACT(metadata, '$.color') = 'red'")->get();

// JSON array search
$products = Product::whereRaw("JSON_CONTAINS(metadata->'$.tags', '\"sale\"')")->get();
```

**MySQL JSON differences from PostgreSQL JSONB:**

| Feature | MySQL JSON | PostgreSQL JSONB |
|---------|-----------|-----------------|
| Storage | Binary JSON (internal) | Decomposed binary |
| Indexing | Multi-valued index (cast to array) | GIN (general + path-specific) |
| Containment operator | `JSON_CONTAINS()` | `@>` operator |
| Key existence | `JSON_KEYS()` / `JSON_CONTAINS_PATH()` | `?` operator |
| Performance | Good for read/store | Superior for indexing + querying |
| Document size warning | Nested docs > 1MB may degrade performance | Keep under 100KB recommended |

**MySQL JSON index example:**

```php
// Multi-valued index on JSON array (MySQL 8.0.17+)
DB::statement("
    CREATE INDEX idx_products_tags ON products(
        (CAST(JSON_EXTRACT(tags, '$[*]') AS UNSIGNED ARRAY))
    )
");

// Virtual generated column + index (works on all MySQL 8.0+)
DB::statement("
    ALTER TABLE products ADD COLUMN color VARCHAR(50)
    GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.color'))) VIRTUAL
");
DB::statement("CREATE INDEX idx_products_color ON products(color)");
```

**Best practice:** For moderate JSON usage, MySQL's JSON column is adequate. For heavy JSON querying, prefer PostgreSQL JSONB.

### 9.7 MySQL Full-Text Search

MySQL InnoDB full-text index specifics:

```php
// Migration — InnoDB full-text index
Schema::create('articles', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->text('body');
    $table->timestamps();
    $table->fullText(['title', 'body']);
});

// Natural Language mode (default — relevance-ordered)
$articles = Article::whereFullText('body', 'web developer')->get();

// Boolean mode — operators
$articles = Article::whereRaw(
    "MATCH(title, body) AGAINST(? IN BOOLEAN MODE)",
    ['+web +developer -javascript']
)->get();

// Query expansion — broader results (use sparingly)
$articles = Article::whereRaw(
    "MATCH(title, body) AGAINST(? WITH QUERY EXPANSION)",
    ['laravel']
)->get();
```

**Boolean mode operators:**
| Operator | Meaning | Example |
|----------|---------|---------|
| `+` | Must include | `+web +developer` |
| `-` | Must exclude | `+web -designer` |
| `*` | Wildcard (suffix) | `devel*` |
| `""` | Exact phrase | `"web developer"` |
| `>` | Increase relevance | `>web developer` |
| `<` | Decrease relevance | `+web <developer` |
| `()` | Grouping | `+(web developer)` |

**MySQL full-text configuration:**

```ini
# my.cnf
innodb_ft_min_token_size = 3        # Minimum word length (default 3)
innodb_ft_max_token_size = 84       # Maximum word length (default 84)
innodb_ft_enable_stopword = 1       # Enable stopword filtering
innodb_ft_server_stopword_table = 'mydb/my_stopwords'  # Custom stopwords
ft_min_word_len = 4                 # MyISAM (legacy, only for non-InnoDB)
```

**Warning:** MySQL ignores words shorter than `innodb_ft_min_token_size` (default 3). For search terms like "AI", "Go", "Rx" — use a `LIKE` fallback:

```php
$results = Article::whereFullText('body', $term)
    ->when(strlen($term) < 3, function ($q) use ($term) {
        return $q->where('body', 'LIKE', "%{$term}%");
    })
    ->get();
```

### 9.8 MySQL Partitioning

Partitioning syntax differs significantly from PostgreSQL:

```php
// RANGE partitioning (by date)
DB::statement("
    CREATE TABLE orders (
        id BIGINT UNSIGNED AUTO_INCREMENT,
        user_id BIGINT UNSIGNED NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        created_at DATETIME NOT NULL,
        PRIMARY KEY (id, created_at)
    ) PARTITION BY RANGE (TO_DAYS(created_at)) (
        PARTITION p_2024 VALUES LESS THAN (TO_DAYS('2025-01-01')),
        PARTITION p_2025 VALUES LESS THAN (TO_DAYS('2026-01-01')),
        PARTITION p_future VALUES LESS THAN MAXVALUE
    );
");

// LIST partitioning (by region)
DB::statement("
    CREATE TABLE orders (
        id BIGINT UNSIGNED AUTO_INCREMENT,
        region ENUM('us', 'eu', 'asia') NOT NULL,
        -- ...
        PRIMARY KEY (id, region)
    ) PARTITION BY LIST COLUMNS(region) (
        PARTITION p_americas VALUES IN ('us', 'ca', 'mx'),
        PARTITION p_europe VALUES IN ('gb', 'de', 'fr'),
        PARTITION p_asia VALUES IN ('jp', 'cn', 'in')
    );
");

// HASH partitioning (uniform distribution)
DB::statement("
    CREATE TABLE events (
        id BIGINT UNSIGNED AUTO_INCREMENT,
        event_date DATETIME NOT NULL,
        PRIMARY KEY (id, event_date)
    ) PARTITION BY HASH (YEAR(event_date)) PARTITIONS 4;
");
```

**MySQL partitioning restrictions:**
- All unique/primary keys must include the partition column
- Foreign keys cannot reference partitioned tables
- No automatic partition pruning with non-deterministic expressions (e.g., `YEAR(NOW())`)
- Maximum 8192 partitions per table
- Partition management requires full `ALTER TABLE` rebuild (blocks writes) — use `pt-online-schema-change` for zero-downtime

**Manage partitions with Laravel commands:**

```php
// Add partition
DB::statement("ALTER TABLE orders REORGANIZE PARTITION p_future INTO (
    PARTITION p_2026 VALUES LESS THAN (TO_DAYS('2027-01-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
)");

// Drop old partition (fast — no row-by-row DELETE)
DB::statement("ALTER TABLE orders DROP PARTITION p_2024");

// Truncate partition
DB::statement("ALTER TABLE orders TRUNCATE PARTITION p_2024");
```

### 9.9 MySQL Replication & High Availability

**GTID-based replication (MySQL 5.6+):**

GTID makes replication topology management much simpler than traditional binlog-file-position:

```ini
# my.cnf — primary
server_id = 1
gtid_mode = ON
enforce_gtid_consistency = ON
log_bin = mysql-bin
binlog_format = ROW
expire_logs_days = 7

# my.cnf — replica
server_id = 2
gtid_mode = ON
enforce_gtid_consistency = ON
relay_log = mysql-relay-bin
read_only = ON
```

**Semi-synchronous replication** — ensures at least one replica has committed before acknowledging the primary:

```ini
# Primary
plugin_load = "rpl_semi_sync_master=semisync_master.so"
rpl_semi_sync_master_enabled = 1
rpl_semi_sync_master_timeout = 1000  # 1s timeout, fall back to async

# Replica
plugin_load = "rpl_semi_sync_slave=semisync_slave.so"
rpl_semi_sync_slave_enabled = 1
```

**MySQL InnoDB Cluster / Group Replication** — multi-primary or single-primary with automatic failover. Use MySQL Router for automatic client routing:

```text
Laravel app → MySQL Router → InnoDB Cluster (3+ nodes)
                              ├── Primary (read/write)
                              ├── Secondary (read-only)
                              └── Secondary (read-only)
```

**PlanetScale / Vitess** — for serverless MySQL with branching workflows (each branch is a separate database). Handles schema migrations differently — use `deploy requests` instead of direct `ALTER TABLE`.

**Laravel read/write splitting on MySQL:**

```php
// config/database.php
'mysql' => [
    'driver' => 'mysql',
    'read' => [
        'host' => ['192.168.1.2', '192.168.1.3'],  // Replicas
    ],
    'write' => [
        'host' => ['192.168.1.1'],  // Primary
    ],
    'sticky' => true,  // Read from primary immediately after writes
    'driver' => 'mysql',
    // ...
],
```

For more advanced routing (query-based, weight-based), use ProxySQL:

```ini
# ProxySQL query rules
mysql_query_rules:
- rule_id: 1
  active: 1
  match_pattern: "^SELECT .* FOR UPDATE"
  destination_hostgroup: 0   # Writer
- rule_id: 2
  active: 1
  match_pattern: "^SELECT "
  destination_hostgroup: 1   # Reader
- rule_id: 3
  active: 1
  match_pattern: ".*"
  destination_hostgroup: 0   # Writer (default)
```

### 9.10 MySQL Query Optimization

**Index hints (use sparingly — optimizer is usually right):**

```php
// Force index usage
$users = DB::table('users')
    ->from(DB::raw('users FORCE INDEX (idx_users_email)'))
    ->where('email', 'john@example.com')
    ->get();

// Ignore index (useful when optimizer picks wrong index)
$users = DB::table('users')
    ->from(DB::raw('users IGNORE INDEX (idx_users_status)'))
    ->where('status', 'active')
    ->get();
```

**EXPLAIN output interpretation (MySQL-specific columns):**

| Column | Meaning |
|--------|---------|
| `type` | Access method: `system` > `const` > `eq_ref` > `ref` > `range` > `index` > `ALL` (worst) |
| `possible_keys` | Indexes MySQL could use |
| `key` | Index MySQL actually chose |
| `key_len` | Bytes used from the index (longer = more columns used) |
| `rows` | Estimated rows examined |
| `Extra` | `Using index` (covering), `Using where` (filter after lookup), `Using filesort` (slow sort), `Using temporary` (bad — temp table needed) |

```sql
EXPLAIN FORMAT=JSON SELECT * FROM orders WHERE user_id = 1\G
```

**Common MySQL performance killers:**
- `Using filesort` — add index matching the `ORDER BY`
- `Using temporary` — need to improve GROUP BY/JOIN with appropriate index
- `Using index condition; Using where` — good (ICP used)
- `type: ALL` — full table scan, needs index

**MySQL optimizer features:**

```sql
-- Index Condition Pushdown (ICP) — default on in 5.6+
-- MySQL pushes WHERE conditions down to the index layer
-- Example: INDEX(tenant_id, status), WHERE tenant_id=1 AND status LIKE '%pending%'
-- ICP filters status at the index level, not after fetching rows

-- Multi-Range Read (MRR) — optimizes disk access for range queries
-- Sorts by primary key before fetching rows (sequential I/O)
SET optimizer_switch = 'mrr=on,mrr_cost_based=off';

-- Hash Join (MySQL 8.0.18+) — for equi-joins without indexes
-- Automatically used when no index available on join column
```

### 9.11 MySQL Monitoring

**Performance Schema queries:**

```sql
-- Top queries by total execution time
SELECT DIGEST_TEXT, COUNT_STAR, SUM_TIMER_WAIT/1000000000 AS total_ms,
       AVG_TIMER_WAIT/1000000000 AS avg_ms, SUM_ROWS_EXAMINED
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 20;

-- Full table scans
SELECT OBJECT_SCHEMA, OBJECT_NAME, COUNT_STAR, SUM_TIMER_WAIT
FROM performance_schema.table_io_waits_summary_by_table
WHERE SUM_TIMER_WAIT > 0
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 20;

-- Index usage (unused indexes)
SELECT OBJECT_SCHEMA, OBJECT_NAME, INDEX_NAME, COUNT_STAR
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE INDEX_NAME IS NOT NULL AND COUNT_STAR = 0;

-- Current locks
SELECT * FROM performance_schema.data_locks;
SELECT * FROM performance_schema.data_lock_waits;
```

**Sys schema queries (MySQL 5.7+):**

```sql
-- Slow queries
SELECT * FROM sys.statement_analysis ORDER BY avg_latency DESC LIMIT 20;

-- Unused indexes
SELECT * FROM sys.schema_unused_indexes;

-- Full table scans
SELECT * FROM sys.statements_with_full_table_scans;

-- IO-heavy queries
SELECT * FROM sys.io_global_by_wait_by_bytes ORDER BY total DESC;
```

**InnoDB status (for deadlock analysis):**

```sql
SHOW ENGINE INNODB STATUS\G
-- Look for "LATEST DETECTED DEADLOCK" section
```

**Top commands for Laravel + MySQL debugging:**

```bash
# Show running queries
mysql -e "SHOW FULL PROCESSLIST"

# Kill a stuck query
mysql -e "KILL 12345"

# Check table sizes
mysql -e "
  SELECT TABLE_NAME, ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS total_mb
  FROM information_schema.TABLES
  WHERE TABLE_SCHEMA = 'mydb'
  ORDER BY total_mb DESC"

# Slow query log analysis
pt-query-digest /var/log/mysql/slow-query.log
```

### 9.12 MySQL-Specific Laravel Schema Builder

```php
// Column types unique to MySQL
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->string('name');

    // MySQL-specific column types
    $table->unsignedInteger('quantity');  // Unsigned integer
    $table->unsignedBigInteger('parent_id');  // Unsigned big integer

    // Enum (use with caution — adding values requires ALTER TABLE)
    $table->enum('status', ['draft', 'published', 'archived']);

    // Set (store multiple values from a predefined set)
    $table->set('flags', ['featured', 'new', 'sale']);

    // IP address (converts to/from binary for efficient storage)
    $table->ipAddress('visitor_ip');

    // MAC address
    $table->macAddress('device_mac');

    $table->timestamps();
});

// MySQL-specific column modifiers
Schema::table('users', function (Blueprint $table) {
    $table->string('email')->charset('utf8mb4');        // Per-column charset
    $table->string('name')->collation('utf8mb4_bin');   // Per-column collation
});

// MySQL engine specification
Schema::create('cache', function (Blueprint $table) {
    $table->string('key')->unique();
    $table->text('value');
    $table->integer('expiration');
    $table->engine = 'InnoDB';  // Default, but explicit is clear
});

// Lock tables for migration safety
Schema::table('orders', function (Blueprint $table) {
    // MySQL uses table-level locks during schema changes
    // For large tables, use pt-online-schema-change instead
});
```

---

## 10. Laravel 13 Vector Search

### 10.1 Overview

Laravel 13 provides native semantic/vector search through the query builder, backed by PostgreSQL's `pgvector` extension and the Laravel AI SDK.

**Requirements:**
- PostgreSQL with `pgvector` extension
- `composer require laravel/ai`
- Embedding provider configured (OpenAI, Gemini, Cohere, Jina, etc.)

### 10.2 Installation

### 10.3 Migration with Vector Column

### 10.4 Model Configuration

### 10.5 Generating Embeddings

### 10.6 Querying by Similarity

### 10.7 Lower-Level Vector Methods

### 10.8 Full-Text + Vector Search (Hybrid)

### 10.9 Reranking

Use AI to reorder any result set by semantic relevance:

```php
use Laravel\Ai\Reranking;

$response = Reranking::of([
    'Django is a Python web framework.',
    'Laravel is a PHP web application framework.',
    'React is a JavaScript library.',
])->rerank('PHP frameworks');

$response->first()->document; // "Laravel is a PHP web application framework."

// Rerank Eloquent results
$articles = Article::query()
    ->whereFullText('body', $request->input('query'))
    ->limit(50)
    ->get()
    ->rerank('body', $request->input('query'), limit: 10);
```

The "retrieve then rerank" pattern gives you both speed (fast full-text index) and semantic accuracy (AI reordering).

---

## 11. Database Debugging & Monitoring

### 11.1 Laravel Query Log

### 11.2 Counting Queries

### 11.3 PostgreSQL Monitoring Queries

```sql
-- Currently running queries
SELECT pid, query_start, state, query
FROM pg_stat_activity
WHERE state = 'active'
ORDER BY query_start DESC;

-- Slow queries (by total execution time)
SELECT query, calls, total_exec_time, mean_exec_time, rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- Table size and index usage
SELECT
    relname as table_name,
    pg_size_pretty(pg_total_relation_size(relid)) as total_size,
    pg_size_pretty(pg_relation_size(relid)) as table_size,
    pg_size_pretty(pg_indexes_size(relid)) as index_size,
    seq_scan, seq_tup_read, idx_scan
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Lock monitoring
SELECT pid, locktype, relation::regclass, mode, granted
FROM pg_locks
WHERE NOT granted; -- Blocked queries
```

---

### 11.4 MySQL Monitoring Queries

```sql
-- Currently running queries
SHOW FULL PROCESSLIST;

-- Top queries by total time (requires Performance Schema)
SELECT DIGEST_TEXT, COUNT_STAR,
       ROUND(SUM_TIMER_WAIT / 1000000000, 2) AS total_sec,
       ROUND(AVG_TIMER_WAIT / 1000000000, 4) AS avg_sec
FROM performance_schema.events_statements_summary_by_digest
ORDER BY total_sec DESC
LIMIT 20;

-- Table sizes
SELECT TABLE_NAME,
       ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS total_mb,
       ROUND(DATA_LENGTH / 1024 / 1024, 2) AS data_mb,
       ROUND(INDEX_LENGTH / 1024 / 1024, 2) AS index_mb,
       TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY total_mb DESC;

-- Deadlock info
SHOW ENGINE INNODB STATUS\G
-- Look for "LATEST DETECTED DEADLOCK" section

-- Unused indexes
SELECT OBJECT_SCHEMA, OBJECT_NAME, INDEX_NAME
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE INDEX_NAME IS NOT NULL AND COUNT_STAR = 0
  AND OBJECT_SCHEMA = DATABASE();

-- Buffer pool hit rate
SELECT (1 - (SUM(innodb_buffer_pool_reads) / NULLIF(SUM(innodb_buffer_pool_read_requests), 0))) * 100 AS hit_rate
FROM performance_schema.global_status
WHERE variable_name IN ('Innodb_buffer_pool_reads', 'Innodb_buffer_pool_read_requests');

-- Slow queries (requires slow query log enabled)
-- Run: mysqldumpslow /var/log/mysql/slow-query.log
-- Or: pt-query-digest /var/log/mysql/slow-query.log
```

---

## 12. Enterprise Database Checklist

Before deploying any code with database interactions:

- [ ] Every critical query analyzed with `EXPLAIN ANALYZE` (or `EXPLAIN FORMAT=JSON` on MySQL)
- [ ] No `SELECT *` in production queries
- [ ] Foreign keys indexed
- [ ] Composite indexes optimized for query filter order (left-most rule for MySQL, left-most for PostgreSQL)
- [ ] N+1 queries eliminated (confirm with query log)
- [ ] Full-text indexes exist before using `whereFullText`
- [ ] Vector columns have HNSW index before using `whereVectorSimilarTo`
- [ ] Embeddings generated in background jobs, not during user requests
- [ ] Morph columns use composite indexes (`$table->morphs()`)
- [ ] `Model::preventLazyLoading()` enabled in development
- [ ] Transactions protect all multi-step writes
- [ ] Consistent lock order across all transactions (deadlock prevention)
- [ ] Deadlock retry strategy implemented (`DB::transaction(attempts: 5)`)
- [ ] Transaction isolation levels documented and appropriate
- [ ] Read replicas used for reporting/analytics
- [ ] Read replicas NOT used for immediately consistent reads
- [ ] Partitioning used for tables exceeding 100M rows
- [ ] Multi-tenant strategy documented and consistently applied
- [ ] Indexes reviewed for over-indexing (run `pg_stat_user_indexes` or `performance_schema.table_io_waits_summary_by_index_usage`)
- [ ] Partial indexes considered for filtered queries on large tables (PostgreSQL: `WHERE` clause; MySQL: generated columns)
- [ ] JSONB GIN indexes created for JSONB queries (PostgreSQL); MySQL JSON columns use generated column indexes
- [ ] Materialized views used for expensive aggregation queries (PostgreSQL); MySQL uses summary tables + scheduled events
- [ ] Triggers contain no business logic
- [ ] Functions and stored procedures documented
- [ ] Data integrity constraints (CHECK, UNIQUE, NOT NULL) enforced at database level
- [ ] Queries use parameterized bindings (no string interpolation)
- [ ] UUID vs auto-increment decision documented (MySQL: auto-increment simpler; PostgreSQL: UUID native)
- [ ] Connection pooling configured for high-concurrency workloads (PgBouncer for PostgreSQL, ProxySQL for MySQL)
- [ ] Database migration strategy reviewed for zero-downtime deployments
- [ ] Slow query log enabled in production
- [ ] MySQL: utf8mb4 charset confirmed (not legacy utf8)
- [ ] MySQL: InnoDB buffer pool sized to 70-80% of RAM
- [ ] MySQL: InnoDB redo log sized for peak write workload (1-4GB)
- [ ] MySQL: `innodb_ft_min_token_size` appropriate for search use case
- [ ] MySQL: `ONLY_FULL_GROUP_BY` enabled in SQL mode
- [ ] MySQL: index key length does not exceed 3072 bytes (InnoDB limit)
- [ ] MySQL: `ALTER TABLE ... INPLACE` or `pt-online-schema-change` used for large table migrations

---

## 13. References

- See skill: `laravel-eloquent` for Eloquent ORM patterns (relationships, scopes, performance)
- See skill: `laravel-patterns` for architecture patterns (Actions, DTOs, Services)
- See skill: `laravel-core-internals` for Service Container, DI, and Contracts
- See skill: `laravel-tdd` for database testing (RefreshDatabase, factories)
- See skill: `laravel-security` for SQL injection prevention
- See rule: `rules/laravel/database.md` for enforced database rules
- See rule: `rules/laravel/eloquent.md` for Eloquent-specific rules
- See agent: `laravel-database` for automated database engineering assistance
- See agent: `laravel-migration` for migration and schema design
