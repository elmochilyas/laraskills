| Metadata | |
|---|---|
| KU ID | ku-03 |
| Subdomain | search-ux-and-analytics |
| Topic | Instant Search with Alpine.js |
| Source | Alpine.js Docs |
| Maturity | Stable |

## Overview

Alpine.js enables lightweight instant search with reactive UI updates. Used alongside Livewire or as a standalone JS layer for search interactions. x-model for input binding, x-debounce for delay, and fetch/Axios for API calls provide real-time search without heavy JavaScript frameworks.

## Core Concepts

- **x-model**: Two-way data binding for search input
- **x-debounce**: Debounce input changes (300ms default)
- **x-init**: Initialize search on component load
- **x-show**: Conditionally show results dropdown
- **fetch/axios**: API calls to Laravel search endpoint
- **x-for**: Iterate over search results

## When To Use

- Lightweight search components without Livewire
- Dropdown search/autocomplete UI
- Client-side search filtering
- Blending with Livewire for complex interactions

## When NOT To Use

- Complex search UIs needing server-side state
- Applications already using Livewire for search
- Accessibility-critical search (Alpine requires JS)

## Best Practices

1. **Use x-debounce.300ms**: Prevent excessive API calls.
2. **Implement minimum characters**: Only search after 2-3 chars.
3. **Close dropdown on click-away**: x-on:click.away.
4. **Handle empty responses**: Show "no results" in dropdown.
5. **Show loading indicator**: Visual feedback during API call.

## Related Topics

- K001 (Search UX patterns)
- K010 (Autocomplete)
- K004 (Search result highlighting)

## AI Agent Notes

- Alpine.js is ideal for lightweight search dropdowns
- Best paired with Laravel API endpoints returning JSON
- For agents: use for autocomplete/search-as-you-type dropdowns

## Verification

- [ ] x-model bound to search input
- [ ] x-debounce.300ms configured
- [ ] Minimum character check before search
- [ ] Dropdown with results rendering
- [ ] Click-away closes dropdown
- [ ] Loading state during API call
- [ ] Empty results handled in dropdown
