---
## Rule Name
Create Both GIN and HNSW Indexes

## Category
Performance

## Rule
Always create a GIN index on the tsvector column and an HNSW index on the vector column for hybrid search.

## Reason
Without both indexes, the slower retrieval path becomes the bottleneck. GIN and HNSW indexes are essential for performant FTS and ANN search respectively.

## Bad Example
```sql
-- Missing GIN or HNSW index — one path is slow
ALTER TABLE documents ADD COLUMN fts_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
```

## Good Example
```sql
ALTER TABLE documents ADD COLUMN fts_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
CREATE INDEX idx_documents_fts ON documents USING GIN(fts_vector);
CREATE INDEX idx_documents_vector ON documents USING HNSW(embedding vector_cosine_ops);
```

## Exceptions
Very small datasets (<10K rows) where sequential scans are acceptable.

## Consequences Of Violation
Unacceptably slow hybrid queries — one retrieval path dominates latency.

---
## Rule Name
Use SQL-Level RRF for Simplicity

## Category
Architecture

## Rule
Implement RRF fusion directly in SQL using CTEs and window functions for simplest pgvector hybrid search.

## Reason
SQL-level RRF avoids application-level fusion code, reduces network round-trips, and keeps hybrid logic in the database.

## Bad Example
```php
// Application-level fusion — two queries, PHP fusion code
$keywordIds = DB::select('SELECT id FROM documents WHERE fts_vector @@ query LIMIT 100');
$vectorIds = DB::select('SELECT id FROM documents ORDER BY embedding <=> ? LIMIT 100');
$fused = rrfFusion($keywordIds, $vectorIds);
```

## Good Example
```php
// SQL-level RRF — single query
$results = DB::select('
    WITH keyword_results AS (...),
         vector_results AS (...)
    SELECT id, SUM(1.0 / (60.0 + rank)) AS rrf_score
    FROM (SELECT id, rank FROM keyword_results UNION ALL SELECT id, rank FROM vector_results) combined
    GROUP BY id ORDER BY rrf_score DESC LIMIT 20
');
```

## Exceptions
Dynamic fusion strategies (per-query-type α) that are easier to implement in PHP.

## Consequences Of Violation
Extra network latency (two round-trips) and application fusion code that could be simpler in SQL.

---
## Rule Name
Benchmark Individual Paths Before Fusion

## Category
Testing

## Rule
Always benchmark FTS-only and vector-only recall independently before evaluating hybrid improvement.

## Reason
If one path has poor recall, fusion amplifies its weaknesses. Fix each path individually before expecting fusion improvement.

## Bad Example
```bash
# Assuming fusion fixes both paths — poor recall from one path drags hybrid quality
```

## Good Example
```php
$ftsQuality = benchmark('fts_only');
$vectorQuality = benchmark('vector_only');
if ($ftsQuality['recall'] < 0.7) improveFTSIndexing();
if ($vectorQuality['recall'] < 0.7) improveEmbeddingQuality();
// Only then evaluate hybrid
$hybridQuality = benchmark('hybrid');
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Poor hybrid results that fusion cannot fix, wasting effort on fusion tuning instead of path improvement.
