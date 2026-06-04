| Metadata | |
|---|---|
| KU ID | K032 |
| Subdomain | search-ux-and-analytics |
| Topic | Meilisearch Search-as-You-Type |
| Source | Meilisearch Docs |
| Maturity | Stable |

## Overview

Meilisearch provides instant search-as-you-type functionality out of the box. As users type, results update in real-time with each keystroke. This is powered by Meilisearch's prefix search and fast indexing. For Laravel applications, this is typically implemented via Livewire, Alpine.js, or Vue with debounced API calls to the search endpoint.

## Core Concepts

- **Prefix Search**: Results update as the user types (incremental search).
- **Debouncing**: Delay API calls until user pauses typing to reduce request volume.
- **Client-Side Rendering**: Results are rendered via JavaScript (Livewire, Alpine, Vue).
- **Search Endpoint**: Laravel controller responding to AJAX search requests.
- **Highlighting**: Matching terms are highlighted in search results.

## When To Use

- E-commerce product search with live preview
- Documentation search with instant results
- Navigation/search that auto-completes as users type
- Any application where fast search UX is a priority

## When NOT To Use

- Very slow search backend (>200ms per query)
- Complex search logic that can't be simplified for instant response
- Low user engagement where the development effort isn't justified
- API-only applications (no frontend interaction)

## Best Practices

1. **Debounce input**: 200-300ms delay before sending API request.
2. **Set minimum characters**: Wait until 2-3 characters before searching.
3. **Limit results**: Return 5-10 results for instant search (not full page results).
4. **Implement loading state**: Show loading indicator while search is in progress.
5. **Cache recent searches**: Reduce backend load for common prefixes.

## Architecture Guidelines

- Laravel controller returns JSON search results (not HTML pages).
- Frontend (Livewire/Alpine/Vue) polls search endpoint on input change.
- Use Scout's `take()` method to limit results for instant search.
- Implement request deduplication to avoid race conditions.

## Performance Considerations

- Instant search targets <100ms response time for acceptable UX.
- Meilisearch prefix search is optimized for speed.
- Debouncing reduces search engine load by 80-90% vs per-keystroke requests.
- Caching popular prefix queries reduces backend load further.

## Related Topics

- K023 (Meilisearch driver setup)
- K030 (Meilisearch ranking rules)
- K025 (Meilisearch typo tolerance)
- K066 (Faceted search implementation)

## AI Agent Notes

- Meilisearch's prefix search makes instant search easy to implement.
- Debounce input, limit results, and cache popular queries.
- For agents: use Livewire or Alpine.js for real-time search; debounce at 200-300ms; return 5-10 results.

## Verification

- [ ] Search endpoint returns JSON results
- [ ] Debouncing implemented (200-300ms)
- [ ] Minimum character threshold set (2-3)
- [ ] Loading state shown during search
- [ ] Caching implemented for common queries
- [ ] Request deduplication in place
