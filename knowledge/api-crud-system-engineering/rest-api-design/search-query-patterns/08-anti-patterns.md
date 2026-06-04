# Anti-Patterns: Search Query Patterns

## LIKE-Based Search
**Description:** Using `WHERE column LIKE '%term%'` for production search.
**Why it happens:** Simplicity; it's the first approach developers think of.
**Consequences:** Full table scans on every search; doesn't scale beyond thousands of records; no relevance ranking.
**Better approach:** Use full-text indexes or dedicated search engines.

## Unrestricted Search Scope
**Description:** Searching across all model columns, including password hashes, internal notes, or JSON blobs.
**Why it happens:** Using `*` wildcard or searching all text columns without consideration.
**Consequences:** Slow queries; irrelevant results; potential information exposure.
**Better approach:** Define explicit searchable fields allowlist.

## No Search Ranking
**Description:** Returning search results in ID order or creation date instead of relevance.
**Why it happens:** No relevance scoring; simple ORDER BY.
**Consequences:** Most relevant results may appear on later pages; poor UX.
**Better approach:** Use full-text search ranking or dedicated search engine relevance scoring.

## Search As Filter
**Description:** Using `?q=status:active` instead of `?filter[status]=active`.
**Why it happens:** Developers overload the search parameter for all querying needs.
**Consequences:** Search and filter concerns are mixed; consumers can't distinguish.
**Better approach:** Search for relevance; filters for exact criteria. Use both as separate parameters.
