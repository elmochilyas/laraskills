---
## Rule Name
Default to HNSW for Production

## Category
Performance

## Rule
Use HNSW index as the default for production pgvector deployments; use IVFFlat only when build speed or memory is a constraint.

## Reason
HNSW provides 2-10x faster queries and higher recall (>99%) compared to IVFFlat at the cost of slower build time and more memory.

## Bad Example
```sql
CREATE INDEX ON items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## Good Example
```sql
CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 200);
```

## Exceptions
Very large datasets where IVFFlat's O(N) build time is critical and lower recall is acceptable.

## Consequences Of Violation
Suboptimal query performance requiring index rebuild when migrating from dev to production.

---
## Rule Name
Tune HNSW ef_search for Recall/Latency Balance

## Category
Performance

## Rule
Always tune HNSW `ef_search` parameter at query time to balance recall and latency; start at 100, increase if recall is insufficient.

## Reason
`ef_search` controls the search breadth. Higher values improve recall but increase latency. Default may not match your recall requirements.

## Bad Example
```sql
-- Default ef_search — may not provide target recall
SET hnsw.ef_search = 100;
```

## Good Example
```sql
-- Tune based on recall requirements
SET hnsw.ef_search = 200;  -- Higher recall
-- or
SET hnsw.ef_search = 50;   -- Lower latency
```

## Exceptions
Small datasets where default ef_search already provides acceptable recall.

## Consequences Of Violation
Either lower recall than required or higher latency than necessary.

---
## Rule Name
Use IVFFlat for Bulk Imports

## Category
Performance

## Rule
Use IVFFlat index for initial bulk imports and rebuild as HNSW after data stabilizes.

## Reason
IVFFlat builds O(N) vs HNSW O(N log N). For large bulk imports, IVFFlat completes faster, then HNSW rebuild provides production query performance.

## Bad Example
```sql
-- Building HNSW during import — slow import process
-- Import 10M records -> very long index build
```

## Good Example
```sql
-- Step 1: IVFFlat for fast import
CREATE INDEX ON items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 1000);

-- Step 2: Drop and rebuild as HNSW for production
DROP INDEX items_embedding_idx;
CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 200);
```

## Exceptions
Small datasets where HNSW build time is acceptable even during import.

## Consequences Of Violation
Significantly slower bulk import process and delayed deployment.

---
## Rule Name
Rebuild Indexes After Significant Data Changes

## Category
Maintainability

## Rule
Periodically rebuild ANN indexes after significant data insertions, updates, or deletions.

## Reason
Both HNSW and IVFFlat indexes degrade with data mutations. Rebuilding maintains optimal query performance and recall.

## Bad Example
```sql
-- Index built once, never rebuilt
-- 50% of data added since index creation -> degraded recall
```

## Good Example
```sql
-- Rebuild after 20%+ data change
DROP INDEX items_embedding_idx;
CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops);
```

## Exceptions
Static datasets that rarely change after initial load.

## Consequences Of Violation
Gradual recall degradation, slower queries, and users complaining about missing results.

---
## Rule Name
Benchmark Both Index Types Before Choosing

## Category
Testing

## Rule
Always benchmark HNSW and IVFFlat with your specific dataset, query distribution, and recall requirements before committing.

## Reason
Optimal index choice depends on data size, dimensionality, query load, and hardware. General guidance may not apply to your specific workload.

## Bad Example
```bash
# Assuming HNSW is always best without testing
# May miss cases where IVFFlat is sufficient
```

## Good Example
```python
hnsw_recall, hnsw_qps = benchmark('hnsw')
ivfflat_recall, ivfflat_qps = benchmark('ivfflat')
# HNSW: 0.99 recall, 500 QPS
# IVFFlat: 0.94 recall, 800 QPS
# Decision: HNSW for high-recall, IVFFlat for high-QPS
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Suboptimal index choice for the specific workload, wasting either recall or throughput.
