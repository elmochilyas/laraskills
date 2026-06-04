---
## Rule Name
Log Every Search Query

## Category
Maintainability

## Rule
Always log every search query with filters, user, and timestamp to a search_queries table.

## Reason
Query logs are essential for relevance tuning, content gap analysis, and monitoring search quality over time.

## Bad Example
```php
// No logging — no visibility into what users search for
Product::search($query)->get();
```

## Good Example
```php
SearchQuery::create([
    'query' => $request->q,
    'filters' => json_encode($request->filters),
    'user_id' => auth()->id(),
    'results_count' => $results->total(),
    'duration_ms' => $duration,
]);
```

## Exceptions
Privacy-restricted search where logging is prohibited.

## Consequences Of Violation
Invisible search patterns — zero-result queries and trending searches go undetected.

---
## Rule Name
Track Clicks with Result Position

## Category
Testing

## Rule
Always track search result clicks with the position (rank) the result appeared in.

## Reason
Position-based CTR reveals whether top-ranked results are actually useful. A low CTR at position 1 indicates relevance problems.

## Bad Example
```php
// Click tracked without position — useless for quality analysis
SearchClick::create(['query' => $query, 'product_id' => $product->id]);
```

## Good Example
```php
SearchClick::create([
    'query' => $query,
    'product_id' => $product->id,
    'position' => $position,  // 1-based rank in results
    'user_id' => auth()->id(),
]);
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Cannot distinguish between "perfect relevance" and "users clicking first result because it's first" — misleading quality metrics.

---
## Rule Name
Monitor Zero-Result Rate Weekly

## Category
Maintainability

## Rule
Always monitor the zero-result rate weekly and investigate queries above a threshold.

## Reason
Zero-result queries indicate content gaps or search configuration issues. A zero-result rate above 5% is a red flag.

## Bad Example
```bash
# Zero-result rate unchecked — may be 15% without anyone noticing
```

## Good Example
```php
$zeroResultRate = SearchQuery::where('results_count', 0)
    ->where('created_at', '>=', now()->subWeek())
    ->count() / SearchQuery::where('created_at', '>=', now()->subWeek())->count();

if ($zeroResultRate > 0.05) {
    Log::warning("Zero-result rate: " . ($zeroResultRate * 100) . "% — investigate");
}
```

## Exceptions
Low-traffic search where rate calculations are noisy.

## Consequences Of Violation
Persistent content gaps driving user frustration without detection.
