---
## Rule Name
Use Cosine Distance as Default Operator

## Category
Design

## Rule
Always use cosine distance (`<=>`) as the default distance operator for text embedding queries.

## Reason
Most modern text embedding models (OpenAI, BGE, E5, Cohere) are trained with cosine similarity.

## Bad Example
```sql
SELECT id, embedding <-> '[0.1, ...]' AS distance FROM items ORDER BY distance LIMIT 10;
```

## Good Example
```sql
SELECT id, embedding <=> '[0.1, ...]' AS distance FROM items ORDER BY distance LIMIT 10;
```

## Exceptions
Embedding models documented to use inner product or L2 distance.

## Consequences Of Violation
Non-optimal ranking order and reduced semantic search quality.

---
## Rule Name
Always Include LIMIT on ANN Queries

## Category
Performance

## Rule
Always use `LIMIT` with pgvector distance queries; never query without a limit.

## Reason
Without `LIMIT`, ANN search returns all documents, eliminating the performance benefit of the index and causing full exhaustive search.

## Bad Example
```sql
SELECT id, embedding <=> '[0.1, ...]' AS distance FROM items ORDER BY distance;
-- No LIMIT — includes all documents
```

## Good Example
```sql
SELECT id, embedding <=> '[0.1, ...]' AS distance FROM items ORDER BY distance LIMIT 10;
```

## Exceptions
Applications requiring exact search on small datasets.

## Consequences Of Violation
Full table scan on every query, severe performance degradation.

---
## Rule Name
Pre-Filter Before ORDER BY

## Category
Performance

## Rule
Apply metadata filters in `WHERE` clauses before the vector `ORDER BY` for better performance.

## Reason
Pre-filtering reduces the number of vectors compared, improving query speed. Post-filtering (in application code) is much slower.

## Bad Example
```php
// Post-filtering in PHP — retrieves all then filters
$results = Document::nearestNeighbors($vector, 1000)
    ->get()
    ->where('status', 'published');
```

## Good Example
```sql
-- Pre-filtering in SQL
SELECT id, embedding <=> $query AS distance
FROM documents
WHERE status = 'published'
ORDER BY distance LIMIT 10;
```

## Exceptions
When filters eliminate too many candidates and recall suffers (use iterative scans instead).

## Consequences Of Violation
Unnecessary network transfer of irrelevant results and slower application-level filtering.

---
## Rule Name
Normalize Vectors for Consistent Distance

## Category
Maintainability

## Rule
Always verify embeddings are normalized (unit length) before storage to ensure correct cosine distance.

## Reason
For unnormalized vectors, cosine distance and dot product produce different rankings. Most embedding models output normalized vectors, but verification prevents subtle bugs.

## Bad Example
```php
$embedding = OpenAI::embeddings()->create(['input' => $text, 'model' => 'text-embedding-3-small']);
// Assuming normalized — not verified
```

## Good Example
```php
$embedding = OpenAI::embeddings()->create(['input' => $text, 'model' => 'text-embedding-3-small']);
$norm = sqrt(array_sum(array_map(fn($v) => $v * $v, $embedding)));
assert(abs($norm - 1.0) < 0.001); // Verify unit length
```

## Exceptions
Embedding models known to output normalized vectors where verification overhead is not justified.

## Consequences Of Violation
Incorrect distance calculations leading to suboptimal search rankings.
