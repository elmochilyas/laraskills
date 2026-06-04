---
## Rule Name
Use HNSW for Production, IVFFlat for Prototyping

## Category
Performance

## Rule
Use HNSW for production vector search and IVFFlat for development and prototyping.

## Reason
HNSW provides superior query performance (2-10x faster, >99% recall). IVFFlat's faster build time suits iterative development.

## Bad Example
```sql
-- IVFFlat in production — poor query performance
CREATE INDEX ON items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

## Good Example
```sql
-- HNSW in production
CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 200);
```

## Exceptions
Production deployments where IVFFlat's lower memory usage is required and lower recall is acceptable.

## Consequences Of Violation
Poor query latency and recall in production, requiring emergency index rebuild.

---
## Rule Name
Tune ef_search for Latency/Recall Tradeoff

## Category
Performance

## Rule
Always tune HNSW `ef_search` parameter at query time for the desired recall level; start at 100, increase if recall is insufficient.

## Reason
`ef_search` is the primary lever for controlling the recall-vs-latency tradeoff in HNSW queries.

## Bad Example
```sql
SET hnsw.ef_search = 100;  -- Default, may be too low
```

## Good Example
```sql
SET hnsw.ef_search = 200;  -- Higher recall
SET hnsw.ef_search = 50;   -- Lower latency
-- Choose based on requirements
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Suboptimal recall or unnecessarily slow queries for the workload.

---
## Rule Name
Rebuild Indexes Periodically After Insertions

## Category
Maintainability

## Rule
Schedule periodic HNSW or IVFFlat index rebuilds after significant data changes.

## Reason
Both index types degrade with data mutations. HNSW quality drops after 20%+ insertions.

## Bad Example
```sql
-- Index never rebuilt — gradual recall degradation
-- Original index: 99% recall
-- After 50% data growth: 85% recall
```

## Good Example
```sql
-- Rebuild after significant data changes
DROP INDEX items_embedding_idx;
CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops);
```

## Exceptions
Static datasets with no changes after initial load.

## Consequences Of Violation
Gradual, undetected search quality degradation over time.
