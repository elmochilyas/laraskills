---
## Rule Name
Use x-debounce.300ms on Input

## Category
Performance

## Rule
Always use Alpine's `x-debounce.300ms` on search input to prevent excessive API calls.

## Reason
Each keystroke fires a network request without debounce. 300ms balances responsiveness with server load.

## Bad Example
```html
<input x-model="search" x-on:input.debounce="fetchResults"> <!-- Wrong directive -->
```

## Good Example
```html
<input x-model="search" x-on:input.debounce.300ms="fetchResults">
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Excessive API calls on every keystroke, overwhelming the search backend.

---
## Rule Name
Close Dropdown on Click-Away

## Category
UX

## Rule
Always close the autocomplete dropdown when the user clicks outside it.

## Reason
An open dropdown blocks the page view. Users expect it to close when interacting elsewhere.

## Bad Example
```html
<div x-show="open" x-on:click.outside="open = false">
    <!-- Dropdown doesn't close on click-away -->
</div>
```

## Good Example
```html
<div x-show="open" x-on:click.away="open = false">
    <!-- Dropdown closes on outside click -->
</div>
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Persistent dropdowns covering content until the user manually dismisses them.

---
## Rule Name
Show Loading Indicator During Search

## Category
UX

## Rule
Always show a loading indicator while the Alpine.js fetch request is in-flight.

## Reason
Without a loading indicator, users see a stale dropdown and don't know the search is in progress.

## Bad Example
```html
<template x-if="results.length">
    <!-- No loading state — results appear without feedback -->
</template>
```

## Good Example
```html
<span x-show="loading" class="text-gray-400">Searching...</span>
<template x-if="!loading && results.length">
    <!-- Results -->
</template>
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Users perceive search as unresponsive or broken.
