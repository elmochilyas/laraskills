# Rules: Search Services (Meilisearch, Typesense)

## Metadata
- **Source KU:** search-services
- **Subdomain:** Development Environments
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- SEARCH-RULE-001: **Use queue-based indexing** — `SCOUT_QUEUE=true` for write-heavy apps avoids blocking responses.
- SEARCH-RULE-002: **Import after adding Searchable** — `php artisan scout:import "App\Models\Product"` populates index.
- SEARCH-RULE-003: **Configure filterable attributes** — `->where()` in Scout requires `filterableAttributes` in Meilisearch.
- SEARCH-RULE-004: **Use Docker service hostname** — `MEILISEARCH_HOST=http://meilisearch:7700` (not `localhost`).
- SEARCH-RULE-005: **Persist master key** — Sail auto-generates; save in .env for reproducible sessions.
- SEARCH-RULE-006: **Match production search engine** — Test relevance parity between dev and prod search.

## Decision Rules
- SEARCH-RULE-007: **Use for full-text search features** requiring typo-tolerant search.
- SEARCH-RULE-008: **Use Scout + Meilisearch** for Laravel search out of the box.
- SEARCH-RULE-009: **Use database LIKE queries** for small datasets where search engine overhead isn't justified.
