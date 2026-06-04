---
## Rule Name
Use Typesense Grouping for Field-Based Dedup

## Category
Design

## Rule
Use Typesense's built-in `group_by` feature for field-based deduplication instead of custom application logic.

## Reason
Typesense handles grouping natively during search — one query, no post-processing. Custom dedup adds complexity and latency.

## Bad Example
```php
// Post-query dedup — extra processing
$results = Product::search($query)->get();
$deduped = $results->unique('source_url');
```

## Good Example
```php
// Typesense native grouping
Product::search($query)->options([
    'group_by' => 'source_url',
    'group_limit' => 1,
])->get();
```

## Exceptions
Near-deduplication based on content similarity (embedding clustering), which Typesense grouping doesn't support.

## Consequences Of Violation
Unnecessary post-processing overhead and complexity when engine-native grouping would suffice.

---
## Rule Name
Implement Content-Based Near-Dedup for Similar Documents

## Category
Design

## Rule
Use embedding similarity clustering or simhash for near-deduplication of semantically similar content.

## Reason
Field-based grouping handles exact duplicates. Near-duplicate content (same story, different source) requires semantic comparison that grouping cannot provide.

## Bad Example
```php
// Exact dedup only — misses near-duplicate articles
Product::search($query)->options(['group_by' => 'url'])->get();
```

## Good Example
```php
// Near-dedup via embedding clustering
$results = Product::search($query)->get();
$clusters = clusterByEmbeddingSimilarity($results, threshold: 0.95);
$deduped = $clusters->map(fn($cluster) => $cluster->first());
```

## Exceptions
Applications where only exact duplicates exist.

## Consequences Of Violation
Near-identical content (same article from different sources) fills result lists, reducing diversity.

---
## Rule Name
Monitor Deduplication Rate

## Category
Maintainability

## Rule
Always monitor the deduplication rate to ensure it isn't too aggressive.

## Reason
Overly aggressive dedup removes useful, meaningfully different results. Under-dedup leaves redundant results. Monitoring detects imbalance.

## Bad Example
```bash
# No monitoring — dedup rate unchecked
# May be removing 40% of results
```

## Good Example
```php
$before = $results->count();
$deduped = deduplicate($results);
$dedupRate = 1 - ($deduped->count() / $before);
if ($dedupRate > 0.3) {
    Log::warning("High deduplication rate: $dedupRate — threshold may be too aggressive");
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Silent removal of useful, meaningfully different results from search.
