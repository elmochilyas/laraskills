| Metadata | |
|---|---|
| KU ID | ku-02 |
| Subdomain | search-ux-and-analytics |
| Topic | Instant Search with Livewire |
| Source | Laravel Livewire Docs |
| Maturity | Stable |

## Overview

Livewire enables instant search with real-time result updates without writing JavaScript. #[Rule] properties, $this->search() calls, and debounced property updates make search feel instant. Livewire's wire:model.live.debounce.300ms provides the search-as-you-type experience.

## Core Concepts

- **wire:model.live.debounce**: Real-time property binding with debounce
- **Computed Search**: Search executed in component's ender() or updated() hook
- **Pagination**: Livewire::withQueryString() for bookmarkable search URLs
- **Loading States**: wire:loading for spinner during search
- **Debounce**: Prevent excessive server requests on keystroke

## When To Use

- Laravel applications already using Livewire
- Search UIs needing real-time feedback
- Avoiding JavaScript for search interactions
- Rapid search UI prototyping

## When NOT To Use

- Mobile-first applications with offline needs
- Very high-traffic search (server-side costs)
- Complex search UIs needing advanced JS interactions

## Best Practices

1. **Use debounce=300ms**: Balance responsiveness with server requests.
2. **Implement wire:loading**: Show loading indicator during search.
3. **Use withQueryString**: Enable bookmarkable and shareable search URLs.
4. **Cache search results**: Reduce redundant queries for same term.
5. **Consider lazy load**: Only search when component is visible.

## Related Topics

- K001 (Search UX patterns)
- K010 (Autocomplete)
- K004 (Search result highlighting)

## AI Agent Notes

- Livewire instant search eliminates need for JS frameworks
- Wire:model.live.debounce is the key directive
- For agents: Livewire is the standard approach for Laravel instant search UIs

## Verification

- [ ] wire:model.live.debounce.300ms configured
- [ ] Loading state with wire:loading
- [ ] Search results update in real-time
- [ ] Pagination with query string
- [ ] Search caching implemented
- [ ] No-results state handled
