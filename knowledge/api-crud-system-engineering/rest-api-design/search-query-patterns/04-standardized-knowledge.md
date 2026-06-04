# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** rest-api-design
**Knowledge Unit:** Search Query Patterns
**Difficulty:** Advanced
**Category:** REST API Design
**Last Updated:** 2026-06-03

---

# Overview

Search Query Patterns are the conventions for implementing search functionality in RESTful APIs — including full-text search, field-specific search, fuzzy matching, faceted search, and result ranking. Search is fundamentally different from filtering: filtering narrows by exact criteria, while search finds relevance matches across multiple fields.

Engineers must care because search is one of the most complex and performance-sensitive API patterns. Poorly designed search endpoints either return irrelevant results (bad recall/precision) or crash under load (unoptimized full-table scans). Well-designed search requires dedicated infrastructure (search indexes), careful query construction, and consumer-friendly parameter conventions.

---

# Core Concepts

**Full-Text Search:** Searching across multiple text fields using database full-text indexes or dedicated search engines (Meilisearch, Algolia, Elasticsearch).

**Field-Specific Search:** `?search[name]=john` — searching within a specific field rather than across all fields.

**Fuzzy Matching:** Approximate matching that handles typos and variations. Supported by dedicated search engines.

**Faceted Search:** Searching with category/attribute filters combined with text search — `?q=shoes&filter[color]=red&filter[size]=10`.

**Result Ranking:** Ordering search results by relevance score rather than arbitrary fields.

**Pagination in Search:** Search results are paginated like regular list endpoints, but total counts may be estimates.

---

# When To Use

- APIs requiring text search across multiple record fields
- E-commerce product search
- Content management system search
- User/admin directory search
- Any endpoint where users type free text to find records

---

# When NOT To Use

- Structured filtering (use filter parameters instead)
- Exact-match lookups (use show endpoint)
- Very small datasets that fit in a single response (client-side search is sufficient)

---

# Best Practices

**Use `?q=` or `?search=` for general search queries.** `GET /api/users?q=john` is the most common convention.

**Use dedicated search infrastructure for production.** MySQL full-text search works for small datasets; Meilisearch/Algolia/Elasticsearch are needed for scale.

**Define searchable fields explicitly.** Not all fields should be searchable. Exclude sensitive or irrelevant fields.

**Return relevance scores when possible.** `{ "data": [...], "meta": { "score": { "1": 0.95, "2": 0.80 } } }`.

**Set minimum query length.** Search queries shorter than 2-3 characters are rarely useful.

---

# Architecture Guidelines

**Search should use dedicated search indexes, not database LIKE queries.** LIKE '%term%' queries don't use indexes and scan full tables.

**Search logic belongs in a dedicated service or search engine class.** `UserSearch::search($query)->applyFilters($filters)->paginate()`.

**Search results should be paginated.** Never return all matching results in a single response.

**Search ranking should be consistent across pages.** Use stable sorting (tie-breaking by ID) for consistent pagination.

---

# Performance Considerations

**LIKE '%term%' queries are slow.** They scan the entire table. Use full-text indexes or dedicated search engines.

**Dedicated search engines (Meilisearch) return results in <10ms** even for millions of records.

**Full-text indexes (MySQL/PostgreSQL) are faster than LIKE but slower than dedicated search engines.**

**Search + filter combinations require composite indexes.** Filter + full-text search is best handled by dedicated search engines.

---

# Security Considerations

**Search query allowlist prevents field exposure.** Only allow searching on intended fields.

**Minimum query length prevents full-table scans.** Require minimum 2-3 characters for search queries.

**Rate limit search endpoints.** Search is more resource-intensive than regular list endpoints.

**Search results must respect authorization.** A user shouldn't find records they can't access.

---

# Common Mistakes

**Search via LIKE '%term%'.** Works for small datasets but doesn't scale. Use full-text indexes or dedicated search.

**No minimum query length.** One-character searches return too many results and stress the database.

**No pagination.** Returning all search results in a single response.

**Searching all fields.** Including sensitive or irrelevant fields in the search scope.

**Inconsistent search behavior.** Different search queries with the same terms return different results (inconsistent ranking).

---

# Anti-Patterns

**LIKE-Based Search:** Using `WHERE column LIKE '%term%'` for production search.
**Better approach:** Use full-text indexes (MySQL FULLTEXT, PostgreSQL tsvector) or dedicated search engines.

**Unrestricted Search Scope:** Searching across all model fields, including sensitive or internal ones.
**Better approach:** Define an explicit searchable fields allowlist.

**No Search Ranking:** Returning search results in arbitrary order instead of by relevance.
**Better approach:** Use relevance scoring from full-text search or dedicated search engines.

**Search As Filter:** Using search parameters where filter parameters would be more appropriate.
**Better approach:** Search for relevance matching across fields. Filter for exact criteria on specific fields.

---

# Examples

**Search implementation with scoping:**
```
class UserSearch
{
    public function search(Builder $query, string $term): Builder
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'like', "%{$term}%")
              ->orWhere('email', 'like', "%{$term}%")
              ->orWhereHas('profile', fn ($q) => $q->where('bio', 'like', "%{$term}%"));
        });
    }
}

// Controller
public function __invoke(SearchRequest $request)
{
    $users = User::query()
        ->tap(fn ($q) => (new UserSearch)->search($q, $request->q()))
        ->paginate();

    return UserResource::collection($users);
}
```

---

# Related Topics

**Prerequisites:**
- Database Indexing
- Query Parameter Filtering

**Closely Related Topics:**
- Full-Text Search in MySQL/PostgreSQL
- Meilisearch/Elasticsearch Integration
- Query Parameter Filtering — combining search with filters

**Advanced Follow-Up Topics:**
- Search Relevance Ranking
- Search Analytics
- Autocomplete/Suggest API Design

**Cross-Domain Connections:**
- Pagination Strategies — search result pagination
- Query Parameter Sorting — relevance vs field sorting
