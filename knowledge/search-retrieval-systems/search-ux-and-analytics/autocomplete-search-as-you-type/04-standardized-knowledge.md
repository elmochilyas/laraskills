| Metadata | |
|---|---|
| KU ID | ku-10 |
| Subdomain | relevance-and-ranking |
| Topic | Autocomplete / Search-as-You-Type |
| Source | Industry |
| Maturity | Stable |

## Overview

Autocomplete (search-as-you-type) provides real-time query suggestions as the user types. This improves search speed and guides users toward effective queries. Implementation options: engine-native (Meilisearch instant search, Algolia InstantSearch), prefix-based database queries, or dedicated autocomplete backends.

## Core Concepts

- **Prefix Search**: Matching query prefix against indexed terms
- **Debouncing**: Delaying search until user pauses typing (typically 300ms)
- **Minimum Characters**: Starting search after N characters (typically 2-3)
- **Result Types**: Queries, products, categories — mixed in dropdown
- **Trending Queries**: Boost popular searches in suggestions

## When To Use

- Any search application for improved UX
- Mobile search (reduces typing effort)
- E-commerce (guides users to products)
- High-query-volume applications

## When NOT To Use

- Low-traffic or internal tools
- Latency-sensitive applications (each keystroke triggers search)
- Content requiring full query context (legal, medical)

## Best Practices

1. **Debounce at 300ms**: Balances responsiveness with server load.
2. **Set minimum 2-3 characters**: Avoid excessive early queries.
3. **Limit suggestions to 5-10**: Avoid overwhelming users.
4. **Show result counts**: "Laptops (234)" provides context.
5. **Use engine-native features**: Meilisearch instant search works out of box.
6. **Cache popular completions**: Reduce redundant queries.

## Related Topics

- K032 (Meilisearch instant search)
- K015 (SearchUsingPrefix attribute)
- K001 (Search UX patterns)

## AI Agent Notes

- Meilisearch provides best out-of-box instant search experience
- Debouncing is critical to avoid excessive API calls
- For agents: use engine-native features, implement debouncing on frontend

## Verification

- [ ] Autocomplete configured with engine features
- [ ] Debouncing implemented (300ms)
- [ ] Minimum characters set (2-3)
- [ ] Suggestion count limited (5-10)
- [ ] Popular queries boosted
- [ ] Cache layer implemented
