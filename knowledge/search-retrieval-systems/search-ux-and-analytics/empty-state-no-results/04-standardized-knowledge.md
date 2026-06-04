| Metadata | |
|---|---|
| KU ID | ku-06 |
| Subdomain | search-ux-and-analytics |
| Topic | Empty State / No Results |
| Source | UX Research / Industry |
| Maturity | Mature |

## Overview

Empty state and no-results UX handles scenarios where search returns zero matches. Poor no-results UX is a top user frustration. Effective patterns: friendly message, "did you mean" suggestions, broader search suggestions, popular/trending alternatives, and contact support option.

## Core Concepts

- **Zero-Result Query**: Search that returns no matching documents
- **No-Query State**: Initial state before user types
- **Empty State Elements**: Message, suggestion, action, illustration
- **Query Suggestions**: "Did you mean X?"
- **Broader Search**: "Try removing filters" or "Search all categories"
- **Popular Alternatives**: Show trending searches or popular items

## When To Use

- Every search implementation (essential UX)
- Applications where zero-result queries are common (e-commerce, content)
- Search with faceted filtering (filters may over-constrain)

## When NOT To Use

- Search where zero results are expected (admin search with specific terms)
- Very simple search (single field, small dataset)

## Best Practices

1. **Never show blank page**: Always provide feedback and alternatives.
2. **Log zero-result queries**: Use analytics to identify content gaps.
3. **Show "did you mean"**: If typo likely, suggest corrected query.
4. **Provide broader alternatives**: "Showing results for all products" when filters are active.
5. **Offer popular searches**: Guide users toward queries that work.
6. **Provide action**: "Contact us" or "Search again with different terms."

## Related Topics

- K009 (Did you mean)
- K011 (Search analytics)
- K001 (Search UX patterns)

## AI Agent Notes

- Empty state is one of the most impactful UX improvements
- Zero-result queries logged → content gap analysis
- For agents: always implement no-results handling with suggestions and alternatives

## Verification

- [ ] No-query state (initial page) designed
- [ ] Zero-result state with message implemented
- [ ] "Did you mean" suggestion shown
- [ ] Broader search alternatives provided
- [ ] Popular queries shown on no results
- [ ] Zero-result queries logged to analytics
- [ ] Contact/feedback action available
