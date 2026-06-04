---
## Rule Name
Always Use debounce.300ms

## Category
Performance

## Rule
Always apply `debounce.300ms` on Livewire `wire:model.live` for search inputs.

## Reason
Without debounce, each keystroke triggers a full Livewire component update. 300ms reduces requests by ~80% while maintaining instant feel.

## Bad Example
```html
<!-- No debounce — fires on every keystroke -->
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
Excessive server requests on every keystroke, degrading server performance and UX.

---
## Rule Name
Use wire:loading for Visual Feedback

## Category
UX

## Rule
Always show a loading indicator using Livewire's `wire:loading` directive during search.

## Reason
Without loading feedback, users see a stale result list and don't know the search is working.

## Bad Example
```html
<!-- No loading indicator — user sees old results during search -->
<div>
    @foreach($results as $result)
        ...
    @endforeach
</div>
```

## Good Example
```html
<div wire:loading class="text-gray-500">Searching...</div>
<div wire:loading.remove>
    @foreach($results as $result)
        ...
    @endforeach
</div>
```

## Exceptions
No common exceptions.

## Consequences Of Violation
Users assume search is unresponsive and may abandon the page.

---
## Rule Name
Enable Query String for Bookmarkable URLs

## Category
UX

## Rule
Always use Livewire's `WithQueryString` trait to persist search query and page in the URL.

## Reason
Without query string persistence, users cannot bookmark search results or share search URLs.

## Bad Example
```php
class Search extends Component
{
    public $search = '';
    // No query string — URL never updates
}
```

## Good Example
```php
use Livewire\WithQueryString;

class Search extends Component
{
    use WithQueryString;
    public $search = '';
    public $page = 1;
}
```

## Exceptions
Non-public search UIs (admin panels) where bookmarking isn't needed.

## Consequences Of Violation
Users cannot share or bookmark search results — all searches start from scratch.
