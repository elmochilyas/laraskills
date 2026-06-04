---
## Rule Name
Debounce Search Input at 300ms

## Category
Performance

## Rule
Always debounce search input at 300ms to balance responsiveness with server load.

## Reason
Each keystroke triggers a search API call without debounce. 300ms provides instant feel while reducing server requests by ~80%.

## Bad Example
```html
<!-- No debounce — fires API call on every keystroke -->
<input wire:model.live="search" />
```

## Good Example
```html
<!-- 300ms debounce — waits for pause before searching -->
<input wire:model.live.debounce.300ms="search" />
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Excessive API calls on every keystroke, overwhelming search engine and degrading UX.

---
## Rule Name
Always Handle Empty and No-Results States

## Category
UX

## Rule
Always implement a non-empty UI for both the initial (no query) and no-results states.

## Reason
Empty states are a top UX complaint. Users need guidance when there are no results — suggestions, popular searches, or alternative queries.

## Bad Example
```html
<!-- Blank page on no results — user has no next step -->
@if($results->isEmpty())
    <!-- nothing -->
@endif
```

## Good Example
```html
@if($results->isEmpty())
    <div>
        <p>No results for "{{ $query }}"</p>
        <p>Try: {{ implode(', ', $suggestions) }}</p>
        <a href="/popular">Browse popular items</a>
    </div>
@endif
```

## Exceptions
No common exceptions.

## Consequences Of Violation
User abandonment — no guidance on what to do after a failed search.

---
## Rule Name
Display Result Counts

## Category
UX

## Rule
Always display the total result count and current result range to users.

## Reason
Result counts provide context — users need to know the size of the result set to decide whether to refine or browse.

## Bad Example
```html
<!-- No count — user doesn't know how many results exist -->
@foreach($results as $result)
    ...
@endforeach
```

## Good Example
```html
<p>Showing {{ $results->firstItem() }}-{{ $results->lastItem() }} of {{ $results->total() }} results</p>
```

## Exceptions
Autocomplete dropdowns where compact UI necessitates omitting counts.

## Consequences Of Violation
Users lack context about search result scope, reducing confidence in results.

---
## Rule Name
Show Loading State During Search

## Category
UX

## Rule
Always display a loading indicator while search results are being fetched.

## Reason
Search requests are asynchronous. Without a loading indicator, users assume the UI is broken or slow.

## Bad Example
```html
<div wire:loading>
    <!-- hidden — no loading indicator -->
</div>
```

## Good Example
```html
<div wire:loading>
    <svg class="animate-spin">...</svg> Searching...
</div>
<div wire:loading.remove>
    <!-- Search results -->
</div>
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Users perceive slow search as broken UI and abandon the page.

---
## Rule Name
Design Mobile-First Search

## Category
UX

## Rule
Always design the search UI for mobile screens first, then enhance for desktop.

## Reason
Over 50% of search traffic comes from mobile. Desktop-first designs often have unusable search on small screens.

## Bad Example
```html
<!-- Desktop-width search — broken on mobile -->
<input style="width: 600px" />
```

## Good Example
```html
<!-- Mobile-first: full-width on small screens -->
<input class="w-full md:w-96" />
```

## Exceptions
Admin/internal tools used exclusively on desktop.

## Consequences Of Violation
Poor mobile search experience drives user abandonment.
