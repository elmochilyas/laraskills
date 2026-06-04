---
## Rule Name
Return JSON for Instant Search Endpoint

## Category
Architecture

## Rule
Always return JSON search results (not HTML views) from the instant search API endpoint.

## Reason
JSON responses are lightweight, cacheable, and can be rendered by Livewire, Alpine.js, or Vue without HTML parsing overhead.

## Bad Example
```php
// Returning HTML — hard to parse on frontend
return view('partials.search-results', ['products' => $products]);
```

## Good Example
```php
return response()->json([
    'results' => Product::search($query)->take(7)->get(),
    'total' => Product::search($query)->count(),
]);
```

## Exceptions
Livewire components rendering Blade templates (still partial view, not full page).

## Consequences Of Violation
Unnecessary bandwidth from HTML responses and frontend parsing complexity.

---
## Rule Name
Limit Instant Search Results to 5-10

## Category
UX

## Rule
Always limit instant search results to 5-10 items — not a full search results page.

## Reason
Instant search is a preview, not a full search. Showing too many results slows response time and clutters the dropdown.

## Bad Example
```php
Product::search($query)->take(50)->get();  // Too many for instant search
```

## Good Example
```php
Product::search($query)->take(7)->get();  // Preview only
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Slow instant search responses and cluttered dropdown UI.

---
## Rule Name
Implement Request Deduplication

## Category
Reliability

## Rule
Always implement request deduplication for instant search to prevent race conditions.

## Reason
Rapid typing can cause out-of-order responses where a later response overwrites results from an earlier, slower response.

## Bad Example
```php
// No dedup — out-of-order responses may show stale results
Livewire::on('searchUpdated', fn() => $this->results = Product::search($this->search)->get());
```

## Good Example
```php
public function updatedSearch(): void
{
    $this->searchId = microtime(true);
    $currentId = $this->searchId;
    
    $results = Product::search($this->search)->take(7)->get();
    
    if ($currentId === $this->searchId) {
        $this->results = $results;
    }
}
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Users see results for a previous, different query — confusing UX.
