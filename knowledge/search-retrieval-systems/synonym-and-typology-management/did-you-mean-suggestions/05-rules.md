---
## Rule Name
Rely on Engine Typo Tolerance First

## Category
Design

## Rule
Use the search engine's built-in typo tolerance before implementing custom "did you mean" suggestions.

## Reason
Meilisearch, Typesense, and Algolia all provide built-in typo correction. Custom "did you mean" is only needed when engine features are insufficient.

## Bad Example
```php
// Custom suggestion system before trying engine typo tolerance
$suggestion = Levenshtein::closest($query, $dictionary);
```

## Good Example
```php
// Engine typo tolerance handles most misspellings automatically
Product::search($query)->get();  // Returns results despite typos
// Only add "did you mean" for zero-result queries
```

## Exceptions
Zero-result queries where engine typo tolerance couldn't find matches.

## Consequences Of Violation
Unnecessary custom implementation when engine features suffice.

---
## Rule Name
Show Suggestions Only on Zero-Result Queries

## Category
UX

## Rule
Display "did you mean" suggestions only when the original query returns zero or very few results.

## Description
Suggestions on queries that already return results confuse users. Show them only when the search fails.

## Bad Example
```html
<!-- Showing suggestions even when results exist — confusing -->
<div>Did you mean "red shoes"?</div>
@foreach($results as $result) ...
@endforeach
```

## Good Example
```php
@if($results->isEmpty() && $suggestion)
    <div>Did you mean "<a href="?q={{ $suggestion }}">{{ $suggestion }}</a>"?</div>
@endif
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Users confused by seeing suggestions alongside relevant results.

---
## Rule Name
Track Suggestion Click-Through Rate

## Category
Testing

## Rule
Always track how often users click on "did you mean" suggestions to measure effectiveness.

## Reason
If users ignore suggestions, the feature is not providing value. CTR data guides improvement or removal.

## Bad Example
```bash
# No tracking — cannot tell if suggestions help users
```

## Good Example
```php
SearchSuggestion::create([
    'original_query' => $query,
    'suggestion' => $suggestion,
    'clicked' => $request->has('suggestion_clicked'),
]);
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Wasted UI space if users ignore suggestions — no data to prove or disprove value.
