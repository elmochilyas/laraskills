---
## Rule Name
Prefer Pre-Filtering Over Post-Filtering

## Category
Performance

## Rule
Always use pre-filtering (metadata filter applied before vector search) over post-filtering (filtering after vector retrieval).

## Reason
Post-filtering wastes resources by retrieving and discarding results that don't match the filter. Pre-filtering narrows the ANN search space.

## Bad Example
```php
// Post-filtering — inefficient
$results = Document::nearestNeighbors($vector, 100)->get();
$filtered = $results->where('category', 'electronics');
```

## Good Example
```php
// Pre-filtering — efficient
$results = Document::where('category', 'electronics')
    ->nearestNeighbors($vector, 10)
    ->get();
```

## Exceptions
Metadata is only available after vector retrieval (e.g., computing metadata from vector results).

## Consequences Of Violation
Higher latency and compute cost from retrieving then discarding many results.

---
## Rule Name
Index All Filterable Metadata Fields

## Category
Performance

## Rule
Always create database indexes on all filterable metadata fields used in vector search queries.

## Reason
Without indexes, metadata filtering requires full table scans, negating the benefit of pre-filtering.

## Bad Example
```php
// No index on category — full scan on filter
$schema = 'CREATE TABLE items (id SERIAL, embedding vector(384), category TEXT)';
```

## Good Example
```php
// B-tree index on filterable field
$schema = 'CREATE TABLE items (id SERIAL, embedding vector(384), category TEXT)';
DB::statement('CREATE INDEX idx_items_category ON items (category)');
```

## Exceptions
Very small tables (<10K rows) where sequential scan is acceptable.

## Consequences Of Violation
Slow filtered vector queries, defeating the performance benefit of pre-filtering.

---
## Rule Name
Implement Iterative Search with Gradual Filter Relaxation

## Category
Reliability

## Rule
Always implement iterative search: start with strict metadata filters and progressively relax them if insufficient results are found.

## Reason
Overly strict filters may eliminate all relevant results. Iterative relaxation ensures result availability without sacrificing relevance.

## Bad Example
```php
// Fixed filter — may return no results
$results = Document::where('price', '<', 5)
    ->nearestNeighbors($vector, 10)
    ->get();
// Empty results — no fallback
```

## Good Example
```php
$filters = [
    ['price', '<', 5],
    ['price', '<', 20],
    ['price', '<', 100],
];
foreach ($filters as $filter) {
    $results = Document::where(...$filter)
        ->nearestNeighbors($vector, 10)
        ->get();
    if ($results->isNotEmpty()) break;
}
```

## Exceptions
Applications where empty results are acceptable (strict compliance filtering).

## Consequences Of Violation
Users see empty search results when metadata filters are too strict.

---
## Rule Name
Choose Filtered ANN Over Post-Filtering When Possible

## Category
Performance

## Rule
Use filtered ANN (filter applied during HNSW/IVFFlat index traversal) when your vector engine supports it.

## Reason
Filtered ANN is the most efficient strategy — it never explores branches that don't match the filter, saving search time.

## Bad Example
```php
// Searching without filter, then filtering — worst performance
```

## Good Example
```php
// Qdrant filtered ANN — filter checked during traversal
$results = $client->search(
    collection_name: "products",
    query_vector: $vector,
    query_filter: Filter(must: [FieldCondition(key: "category", match: MatchValue(value: "electronics"))])
);
```

## Exceptions
Vector engines that don't support filtered ANN (some older versions).

## Consequences Of Violation
Higher query latency than necessary for filtered vector searches.
