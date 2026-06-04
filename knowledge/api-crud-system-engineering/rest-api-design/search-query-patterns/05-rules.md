# Rules: Search Query Patterns

## Rule: Use `?q=` For General Search
- **Condition:** When implementing search endpoints
- **Action:** Use `?q=searchterm` for general search queries. Reserve `?search[field]=value` for field-specific search.
- **Consequence:** Consistent search parameter conventions across endpoints.
- **Enforcement:** API style guide documents search parameter conventions.

## Rule: Define Searchable Fields Explicitly
- **Condition:** When configuring search scope
- **Action:** Define an explicit list of searchable fields. Exclude sensitive, internal, or non-text fields.
- **Consequence:** Search scope is predictable; sensitive fields are not searchable.
- **Enforcement:** Code review verifies search scope allowlist.

## Rule: Set Minimum Search Query Length
- **Condition:** When accepting search queries
- **Action:** Enforce a minimum query length (default: 2-3 characters). Return empty results or 422 for shorter queries.
- **Consequence:** Prevents full-table scans from short queries; returns meaningful results.
- **Enforcement:** Form Request validation enforces minimum search query length.

## Rule: Use Dedicated Search Infrastructure At Scale
- **Condition:** When search is a primary feature and dataset exceeds 100,000 records
- **Action:** Integrate a dedicated search engine (Meilisearch, Algolia, Elasticsearch). Route search queries through the search engine, not the database.
- **Consequence:** Sub-10ms search response times; fuzzy matching; relevance ranking.
- **Enforcement:** Performance tests verify search response times meet SLA.

## Rule: Paginate Search Results
- **Condition:** In every search response
- **Action:** Apply pagination to search results. Never return all matching results.
- **Consequence:** Consistent response times regardless of match count.
- **Enforcement:** Contract tests verify search responses include pagination metadata.

## Rule: Return Stable Search Ordering
- **Condition:** When returning paginated search results
- **Action:** Use a stable sort (relevance score + tie-breaking ID) for search result ordering across pages.
- **Consequence:** Consistent results across pagination requests.
- **Enforcement:** Integration tests verify consistent ordering across page requests.
