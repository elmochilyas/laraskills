---
## Rule Name
Prefer Pre-Filtering Over Post-Filtering

## Category
Performance

## Rule
Always use pre-filtering (metadata filter before vector search) over post-filtering (after vector search).

## Reason
Pre-filtering narrows the ANN search space, reducing the number of vectors to compare. Post-filtering wastes compute retrieving then discarding results.

## Bad Example
```php
// Post-filtering — retrieves then discards
$results = Document::nearestNeighbors($vector, 100)->get();
$filtered = $results->where('category', 'electronics');
```

## Good Example
```php
// Pre-filtering — narrows search space first
$results = Document::where('category', 'electronics')
    ->nearestNeighbors($vector, 10)
    ->get();
```

## Exceptions
Metadata is only available after retrieval (computed from vector results).

## Consequences Of Violation
Higher query latency from retrieving then discarding many irrelevant results.

---
## Rule Name
Implement Iterative Search for Strict Filters

## Category
Reliability

## Rule
Always implement iterative search: start with strict metadata filters and progressively relax them if insufficient results are found.

## Reason
Strict filters can eliminate all relevant results. Iterative relaxation ensures users see results even when filters are too restrictive.

## Bad Example
```php
// Single strict filter — may return nothing
Document::where('price', '<', 5)->nearestNeighbors($vector, 10)->get();
// Empty — user sees no results
```

## Good Example
```php
$filters = [
    ['price', '<', 5],
    ['price', '<', 20],
    ['price', '<', 100],
];
foreach ($filters as $filter) {
    $results = Document::where(...$filter)->nearestNeighbors($vector, 10)->get();
    if ($results->isNotEmpty()) break;
}
```

## Exceptions
Applications where empty results are acceptable (strict compliance filtering).

## Consequences Of Violation
Users see empty search results when metadata filters are too restrictive.

---
## Rule Name
Index All Filterable Attributes

## Category
Performance

## Rule
Always create indexes on all metadata fields used for pre-filtering in vector search.

## Reason
Without indexes, metadata pre-filtering requires full table scans, negating the performance benefit of pre-filtering.

## Bad Example
```php
// No index — pre-filtering does full scan
Document::where('category', 'electronics')->nearestNeighbors($vector, 10)->get();
```

## Good Example
```php
DB::statement('CREATE INDEX idx_documents_category ON documents (category)');
Document::where('category', 'electronics')->nearestNeighbors($vector, 10)->get();
```

## Exceptions
Small datasets (<10K rows) where sequential scans are acceptable.

## Consequences Of Violation
Pre-filtered vector search performs no better than post-filtering due to unindexed metadata scans.
