| Metadata | |
|---|---|
| KU ID | ku-01 |
| Subdomain | search-ux-and-analytics |
| Topic | Search UX Patterns |
| Source | Industry / UX Research |
| Maturity | Mature |

## Overview

Search UX patterns define how users interact with search: input design, result display, empty states, faceted navigation, and instant search. Good search UX reduces cognitive load, helps users find what they need quickly, and gracefully handles edge cases (no results, errors, typos).

## Core Concepts

- **Search Input**: Clear placeholder, visible icon, debounced input, clear button
- **Search-as-You-Type**: Instant results as user types (debounced)
- **Result Display**: Card layout, snippet/highlighting, metadata, actions
- **Empty State**: Friendly message, suggestions, popular searches
- **No Results**: "Did you mean?", broader search suggestion, contact support
- **Faceted Navigation**: Attribute-based drill-down with count badges
- **Loading States**: Skeleton screens for async search results

## When To Use

- Any application with search functionality
- Improving existing search UX
- New search implementation

## When NOT To Use

- Internal tools where UX polish is low priority
- Very simple search (single input + results list)

## Best Practices

1. **Debounce at 300ms**: Balance responsiveness with server load.
2. **Show result counts**: Provide context for result set size.
3. **Always handle empty states**: Never show blank page on no results.
4. **Provide search suggestions**: Guide users toward effective queries.
5. **Highlight search terms**: Show why results matched.
6. **Mobile-first**: Design for touch, small screens, and slow connections.

## Related Topics

- K032 (Instant search)
- K004 (Search result highlighting)
- K006 (Empty state handling)

## AI Agent Notes

- Search UX is often neglected — invest in it early
- Empty state and no-results handling are the most impactful UX improvements
- For agents: implement debounce, loading states, empty state, and no-results handling as minimum

## Verification

- [ ] Search input with debounce (300ms)
- [ ] Loading state during search
- [ ] Result snippets with highlighting
- [ ] Empty state on no query
- [ ] No-results handling with suggestions
- [ ] Mobile-responsive search UI
- [ ] Accessibility considerations
