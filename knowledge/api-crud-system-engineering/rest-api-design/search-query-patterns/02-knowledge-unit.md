# Search Query Patterns

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** rest-api-design
- **Knowledge Unit:** Search Query Patterns
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary
Search Query Patterns define how API consumers search across records using free-text queries. Unlike filtering (exact match), search finds relevance matches across multiple fields. Well-designed search endpoints balance result quality with query performance, using dedicated search infrastructure for production scale.

---

## Core Concepts
- **General Search**: `?q=term` or `?search=term` — searching across multiple text fields
- **Field-Specific Search**: `?search[name]=john` — searching within a specific field
- **Full-Text Search**: Using database full-text indexes or dedicated search engines for efficient text matching
- **Fuzzy Matching**: Approximate matching handling typos and variations
- **Result Ranking**: Ordering results by relevance score rather than arbitrary fields
- **Minimum Query Length**: Enforcing a minimum character count to prevent full-table scans
- **Searchable Fields Allowlist**: Explicitly defining which fields are searchable

---

## Mental Models
1. **Library Card Catalog Model**: The query is a search term; the search engine is the card catalog that efficiently finds matching records and ranks them by relevance.
2. **Search Engine Model**: Like Google — you type a query and get ranked results. The API is responsible for deciding what's relevant and in what order.

---

## Internal Mechanics
The controller receives `?q=searchterm`. The search service validates the query (minimum length, sanitization), builds a search query using full-text indexes or a dedicated engine, applies filters, paginates results, and returns ranked results. Dedicated search engines (Meilisearch, Algolia) handle indexing, ranking, and querying outside the database.

---

## Patterns

### Pattern 1: Database Full-Text Search
**Purpose**: Use MySQL FULLTEXT or PostgreSQL tsvector indexes for search
**Benefits**: No additional infrastructure; good for small-medium datasets
**Tradeoffs**: Limited ranking control; performance degrades at scale

### Pattern 2: Dedicated Search Engine
**Purpose**: Use Meilisearch, Algolia, or Elasticsearch for production search
**Benefits**: Sub-10ms response times; advanced ranking; typo tolerance
**Tradeoffs**: Additional infrastructure; data synchronization complexity

### Pattern 3: Scope-Based Search
**Purpose**: Encapsulate search logic in Eloquent scopes or dedicated search classes
**Benefits**: Reusable, testable, clean controllers
**Tradeoffs**: Can be complex for multi-field search

---

## Architectural Decisions
### When To Use
- APIs requiring text search across multiple record fields
- E-commerce product search
- Content management system search
- User/admin directory search

### When To Avoid
- Structured filtering (use filter parameters instead)
- Exact-match lookups (use show endpoint)
- Very small datasets fitting in one response (client-side search suffices)

### Alternatives
- Filter-based narrowing for structured data
- Autocomplete/suggest endpoints for type-ahead
- Client-side search for tiny datasets

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Rich search experience | Full-text search requires indexes | Add full-text indexes; optimize for query patterns |
| Relevance-ranked results | Dedicated search adds infrastructure cost | Start with DB full-text; migrate as needed |
| Typo-tolerant matching | Data sync latency with dedicated engines | Use webhooks for real-time indexing |
| Fast query execution | LIKE '%term%' queries don't scale | Never use LIKE for production search |

---

## Performance Considerations
- `LIKE '%term%'` scans full tables — never use for production search
- MySQL FULLTEXT indexes are faster than LIKE but slower than dedicated engines
- Dedicated search engines return results in <10ms for millions of records
- Search + filter combinations need composite handling (filters in search engine or hybrid approach)
- Rate limit search endpoints — they're more resource-intensive than list endpoints

---

## Production Considerations
- Define a searchable fields allowlist — exclude sensitive or irrelevant fields
- Set minimum query length (2-3 characters) to prevent full scan abuse
- Paginate search results with stable ranking across pages
- Return relevance scores when possible for client-side ranking display
- Monitor search performance and common query patterns
- Test search result authorization — users should only find accessible records

---

## Common Mistakes
**LIKE-based production search**: Works for small datasets but doesn't scale. Use full-text indexes or dedicated search.
**No minimum query length**: One-character searches return too many results and stress the database.
**No pagination**: Returning all search results in a single response damages UX and server performance.
**Searching all fields**: Including sensitive or irrelevant fields in the search scope exposes data.
**Inconsistent search behavior**: Different search queries with the same terms return different results due to inconsistent ranking.

---

## Failure Modes
**Full-table scan on search**: No full-text index causes slow queries on every search. *Detection:* Slow query log. *Mitigation:* Add full-text indexes; enforce minimum query length.
**Search index staleness**: Dedicated engine index is behind the database. *Detection:* Missing results for recently created records. *Mitigation:* Use webhook-driven real-time indexing.
**Search result authorization bypass**: Users find records they shouldn't access. *Detection:* Security audit. *Mitigation:* Apply authorization filters to search queries.

---

## Ecosystem Usage
Laravel Scout integrates with Meilisearch, Algolia, and database drivers. `whereFullText()` in Laravel 13 enables database full-text search. Scopes and search service classes encapsulate search logic. Meilisearch is the recommended lightweight production search engine.

---

## Related Knowledge Units
### Prerequisites
- Database indexing basics
- Query parameter filtering
- Full-text search concepts

### Related Topics
- Query parameter sorting
- Pagination strategies
- Result relevance ranking

### Advanced Follow-up Topics
- Meilisearch integration and configuration
- Search analytics and query optimization
- Autocomplete/suggest API design
- Faceted search implementation

---

## Research Notes
- Laravel Scout with Meilisearch is the recommended stack for Laravel production search
- MySQL FULLTEXT indexes support Boolean mode for advanced query syntax
- PostgreSQL tsvector provides ranking with `ts_rank()` function
- Search is fundamentally different from filtering — design search endpoints separately from list endpoints
