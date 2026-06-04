| Metadata | |
|---|---|
| KU ID | ku-05 |
| Subdomain | search-ux-and-analytics |
| Topic | Search Result Pagination |
| Source | Laravel Scout |
| Maturity | Stable |

## Overview

Search result pagination divides large result sets into manageable pages. Scout provides paginate() method returning Laravel's LengthAwarePaginator. Engine pagination differs from database pagination — each page is a separate search engine query. Cursor-based pagination is available for large datasets.

## Core Concepts

- **paginate()**: Returns LengthAwarePaginator with search results
- **Per-Page Config**: paginate(20) for 20 results per page
- **Each Page = New Query**: Backend queries engine for each page
- **Total Count**: Engine reports total matching documents
- **Cursor Pagination**: Efficient for very large result sets
- **Query String**: Page number in URL for bookmarkable results

## When To Use

- Result sets larger than single page (10+ results)
- User expectation of page-based navigation
- SEO and bookmarkable search results

## When NOT To Use

- Infinite scroll (load more via AJAX)
- <20 results total (no pagination needed)
- Real-time search results (debatable — paginate for usability)

## Best Practices

1. **Use paginate() over manual offset**: Scout handles engine-specific pagination.
2. **Limit page depth**: Some engines have max page limits (Algolia: 1000).
3. **Cache popular pages**: Reduce redundant engine queries.
4. **Show result count**: "Page 3 of 25 (500 results)".
5. **Use cursor for large datasets**: More efficient for deep pagination.

## Related Topics

- K012 (Scout paginate)
- K001 (Search UX patterns)

## AI Agent Notes

- Each page triggers a new search engine query — cache aggressively
- Deep pagination (>1000 results) may be limited by engine
- For agents: use paginate(), implement caching, handle page depth limits

## Verification

- [ ] paginate() implemented in search
- [ ] Per-page configuration set
- [ ] Page navigation UI working
- [ ] Result count displayed
- [ ] Page depth limits handled
- [ ] Caching for popular pages
