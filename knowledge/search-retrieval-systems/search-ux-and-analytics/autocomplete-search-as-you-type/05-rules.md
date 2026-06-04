---
## Rule Name
Debounce at 300ms

## Category
Performance

## Rule
Always debounce autocomplete input at 300ms before triggering a search.

## Reason
Each keystroke fires a search query without debounce. 300ms balances responsiveness with server load, reducing requests by ~80%.

## Bad Example
```html
<!-- No debounce — fires search on every keystroke -->
<input wire:model.live="search" />
```

## Good Example
```html
<!-- 300ms debounce — waits for pause -->
<input wire:model.live.debounce.300ms="search" />
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Excessive API calls hammering the search engine on every keystroke.

---
## Rule Name
Set Minimum 2-3 Characters Before Searching

## Category
Performance

## Rule
Always require a minimum of 2-3 characters before triggering autocomplete queries.

## Reason
Single-character searches are almost always non-useful and generate excessive early queries with no meaningful results.

## Bad Example
```php
// Searching on single character — wasteful
Product::search('a')->take(5)->get();
```

## Good Example
```php
public function updatedSearch(): void
{
    if (strlen($this->search) < 2) {
        $this->results = [];
        return;
    }
    $this->results = Product::search($this->search)->take(5)->get();
}
```

## Exceptions
Single-character searches that return meaningful results (product codes, initials).

## Consequences Of Violation
Unnecessary search load and poor UX from irrelevant single-character suggestions.

---
## Rule Name
Limit Suggestions to 5-10 Items

## Category
UX

## Rule
Always limit autocomplete suggestions to 5-10 items maximum.

## Reason
Users scan suggestions quickly. More than 10 items is overwhelming and defeats the purpose of guiding the user.

## Bad Example
```php
Product::search($query)->take(50)->get();  // Too many suggestions
```

## Good Example
```php
Product::search($query)->take(7)->get();  // 5-10 optimal
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Overwhelming suggestion list that users ignore rather than benefit from.

---
## Rule Name
Cache Popular Autocomplete Results

## Category
Performance

## Rule
Always cache popular autocomplete results to reduce redundant search engine queries.

## Reason
Top search queries are repeated frequently. Caching avoids hitting the search engine for the same suggestions repeatedly.

## Bad Example
```php
// Uncached — each keystroke hits search engine
Product::search($query)->take(7)->get();
```

## Good Example
```php
$results = Cache::remember("autocomplete:$query", 3600, function () use ($query) {
    return Product::search($query)->take(7)->get();
});
```

## Exceptions
Real-time-changing data where cache staleness is unacceptable.

## Consequences Of Violation
Redundant search engine queries for identical autocomplete inputs.
