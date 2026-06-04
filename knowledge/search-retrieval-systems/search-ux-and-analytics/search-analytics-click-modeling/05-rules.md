---
## Rule Name
Log Every Search Query

## Category
Maintainability

## Rule
Always log every search query with query text, filters, result IDs, and positions to a structured log.

## Reason
Query logs are the foundation of search analytics. Without them, zero-result rate, CTR, and popular searches cannot be measured.

## Bad Example
```php
// No logging — search is a black box
Product::search($query)->get();
```

## Good Example
```php
SearchLog::create([
    'query' => $request->q,
    'filters' => $request->filters,
    'user_id' => auth()->id(),
    'result_ids' => $results->pluck('id'),
    'result_count' => $results->count(),
    'duration_ms' => $duration,
]);
```

## Exceptions
Privacy-restricted search where logging is prohibited.

## Consequences Of Violation
No visibility into search quality metrics — cannot measure improvement or detect regressions.

---
## Rule Name
Monitor Zero-Result Rate Below 5%

## Category
Maintainability

## Rule
Always monitor the zero-result rate and take action when it exceeds 5%.

## Reason
A zero-result rate above 5% indicates significant content gaps or configuration issues that directly harm user experience.

## Bad Example
```bash
# Zero-result rate unknown — may be 20%
```

## Good Example
```php
$zeroResultRate = $this->getZeroResultRate();
if ($zeroResultRate > 0.05) {
    $topZeroResult = SearchLog::where('result_count', 0)
        ->groupBy('query')
        ->orderByRaw('COUNT(*) DESC')
        ->take(10)
        ->pluck('query');
    Log::warning("Zero-result rate: $zeroResultRate. Top: " . $topZeroResult->implode(', '));
}
```

## Exceptions
Niche search domains where zero results are expected for many queries.

## Consequences Of Violation
Persistent user frustration from unaddressed content gaps.

---
## Rule Name
Track CTR by Result Position

## Category
Testing

## Rule
Always calculate and monitor CTR by result position to detect ranking issues.

## Reason
Expected CTR distribution is strongly position-biased (position 1 ≫ position 2). Deviations indicate ranking problems.

## Bad Example
```bash
# No CTR tracking — cannot detect ranking issues
```

## Good Example
```php
$ctrByPosition = SearchClick::select('position', DB::raw('COUNT(*) as clicks'))
    ->where('created_at', '>=', now()->subWeek())
    ->groupBy('position')
    ->orderBy('position')
    ->get();
// Expected: position 1 ~40%, position 2 ~20%, position 3 ~10%
// If position 3 > position 1 — ranking problem
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Undetected ranking issues — users clicking lower results more than top results.
