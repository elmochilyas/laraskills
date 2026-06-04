---
## Rule Name
Install pgvector via Migration

## Category
Framework Usage

## Rule
Always install the pgvector extension through a Laravel migration using `DB::statement('CREATE EXTENSION IF NOT EXISTS vector')`.

## Reason
Migration-based extension installation is repeatable, reversible, and tracked in version control. Direct SQL or manual installation causes environment drift.

## Bad Example
```sql
-- Manual SQL executed outside migrations
CREATE EXTENSION vector;
```

## Good Example
```php
// In a migration
public function up()
{
    DB::statement('CREATE EXTENSION IF NOT EXISTS vector');
}

public function down()
{
    DB::statement('DROP EXTENSION IF EXISTS vector');
}
```

## Exceptions
Managed PostgreSQL providers (Supabase, RDS) that pre-install the extension.

## Consequences Of Violation
Extension missing in some environments, deployment failures, and untracked infrastructure changes.

---
## Rule Name
Default to HNSW Indexes

## Category
Performance

## Rule
Use HNSW indexes as the default ANN index type for pgvector; use IVFFlat only when build speed or memory constraints dictate.

## Reason
HNSW provides 2-10x faster queries and higher recall than IVFFlat at the cost of slower build time and more memory.

## Bad Example
```sql
CREATE INDEX ON items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
// Worse query performance for production
```

## Good Example
```sql
CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 200);
```

## Exceptions
Very large datasets where IVFFlat's faster build time is critical and lower recall is acceptable.

## Consequences Of Violation
Suboptimal query performance requiring index rebuild when migrating to production.

---
## Rule Name
Tune Index Parameters for Dataset

## Category
Performance

## Rule
Always tune HNSW (`m`, `ef_construction`, `ef_search`) and IVFFlat (`lists`, `probes`) parameters based on your dataset size and recall requirements.

## Reason
Default parameters are conservative. Tuning can significantly improve recall/latency tradeoff.

## Bad Example
```sql
CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops);
-- Default m=16, ef_construction=100
```

## Good Example
```sql
CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops) WITH (m = 32, ef_construction = 300);
-- Better recall for production
SET hnsw.ef_search = 200;
-- Tune at query time
```

## Exceptions
Small datasets (<100K vectors) where defaults already provide sufficient recall.

## Consequences Of Violation
Suboptimal performance: either slower queries than necessary or lower recall than achievable.

---
## Rule Name
Monitor Index Build Time for Large Datasets

## Category
Performance

## Rule
Always plan index builds during low-traffic periods; large vector indexes may take significant time to build.

## Reason
HNSW index building is O(N log N) and CPU-intensive. Building during peak traffic degrades query performance.

## Bad Example
```sql
-- Rebuilding large index during business hours
CREATE INDEX CONCURRENTLY ON items USING hnsw (embedding vector_cosine_ops);
-- Production queries slowed during rebuild
```

## Good Example
```sql
-- Schedule during maintenance window
-- Or use IVFFlat for faster initial build, rebuild as HNSW later
```

## Exceptions
Small datasets where index build completes in seconds.

## Consequences Of Violation
Query performance degradation during index build, potentially causing timeouts.

---
## Rule Name
Store Vectors with Correct Dimension

## Category
Maintainability

## Rule
Always specify the exact embedding dimension when adding a vector column; use `vector(n)` where n matches the embedding model's output dimension.

## Reason
pgvector enforces dimension matching at query time. Mismatched dimensions cause query errors.

## Bad Example
```php
Schema::table('documents', function (Blueprint $table) {
    $table->vector('embedding'); // No dimension specified
});
```

## Good Example
```php
Schema::table('documents', function (Blueprint $table) {
    $table->vector('embedding', 1536); // Matching OpenAI text-embedding-3-small
});
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Runtime errors when querying with mismatched vector dimensions, requiring emergency migration.
