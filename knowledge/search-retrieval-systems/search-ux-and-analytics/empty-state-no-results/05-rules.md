---
## Rule Name
Never Show Blank Page on No Results

## Category
UX

## Rule
Always display a helpful message with suggestions when search returns zero results.

## Reason
Blank pages on zero results are the #1 search UX complaint. Users need guidance on next steps.

## Bad Example
```html
@if($results->isEmpty())
    <!-- Blank — nothing shown -->
@endif
```

## Good Example
```html
@if($results->isEmpty())
    <div>
        <h3>No results for "{{ $query }}"</h3>
        <p>Try: {{ implode(', ', $suggestions) }}</p>
        <x-popular-searches />
        <a href="/contact">Contact support</a>
    </div>
@endif
```

## Exceptions
No common exceptions.

## Consequences Of Violation
User frustration and abandonment — no direction on what to do next.

---
## Rule Name
Log Zero-Result Queries for Analytics

## Category
Maintainability

## Rule
Always log zero-result queries to identify content gaps and improvement opportunities.

## Reason
Zero-result queries indicate gaps in content or search configuration. Analytics reveal patterns for prioritization.

## Bad Example
```php
// No logging — content gaps remain invisible
if ($results->isEmpty()) return view('search.no-results');
```

## Good Example
```php
if ($results->isEmpty()) {
    Log::channel('search')->info('Zero result query', ['query' => $query, 'filters' => $filters]);
    return view('search.no-results', ['suggestions' => getSuggestions($query)]);
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Undetected content gaps — users repeatedly search for content that doesn't exist.

---
## Rule Name
Offer Broader Search Alternatives

## Category
UX

## Rule
Always offer broader search alternatives when filters over-constrain results.

## Reason
Active facet filters are a common cause of zero results. Removing filters often reveals matching results users would otherwise miss.

## Bad Example
```html
<div>No results for "{{ $query }}"</div>
```

## Good Example
```html
@if($results->isEmpty() && $hasActiveFilters)
    <p>No results with current filters. Try:</p>
    <a href="{{ url()->withoutQuery(['category', 'brand']) }}">Search all categories</a>
@endif
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Users abandon search when filters over-constrain, unaware that removing filters would show results.
