# Decision Trees: Search Query Patterns

## Tree 1: Search vs Filter

```
Is the user typing free text or selecting from known values?
├── Free text search → Use `?q=` parameter. Search across multiple fields.
├── Selecting known values → Use `?filter[field]=value`. Exact match or range.
├── Combination → Use `?q=term&filter[category]=value`. Search + filter.
└── Autocomplete/suggest → Use dedicated suggest endpoint with ?q= prefix.
```

## Tree 2: Search Infrastructure Selection

```
Dataset size and search complexity?
├── < 10,000 records → MySQL FULLTEXT index or PostgreSQL tsvector. Simple and sufficient.
├── 10,000 - 100,000 records → Consider dedicated search engine. MySQL FULLTEXT may still work.
├── 100,000 - 1,000,000 records → Dedicated search engine (Meilisearch, Typesense). Fuzzy matching needed.
└── 1,000,000+ records → Elasticsearch or Algolia. Advanced relevance tuning required.
```

## Tree 3: Search Query Handling

```
How long is the search query?
├── 0-2 characters → Return empty results or prompt for longer query.
├── 3-10 characters → Standard search. Full-text matching.
├── 10-50 characters → Exact phrase matching if quoted, else term matching.
└── 50+ characters → Likely a paragraph. Consider limiting or rejecting.
```
