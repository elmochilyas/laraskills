# Decision Trees: Top-Level Meta and Links

## Tree 1: Response Envelope Structure

```
What type of response is this?
├── Single resource → { data: { ... }, meta: { request_id, api_version }, links: { self } }
├── Collection (paginated) → { data: [ ... ], meta: { request_id, api_version, current_page, per_page, total, last_page }, links: { self, first, prev, next, last } }
├── Created resource (201) → { data: { ... }, meta: { request_id, api_version }, links: { self } }
├── Empty/No content (204) → No body. No meta or links needed.
└── Error → { errors: [ ... ], meta: { request_id, api_version, error_code } }
```

## Tree 2: Meta Field Selection

```
What context does the consumer need?
├── Request tracing → Include request_id (UUID), api_version, timestamp
├── Pagination state → Include current_page, per_page, total, last_page, from, to
├── Rate limit status → Include rate_limit_remaining, rate_limit_reset
├── Processing metadata → Include processing_time_ms, cached (boolean)
└── Deprecation warnings → Include deprecation_notice with sunset date
```

## Tree 3: Link Strategy

```
What navigation does the response need?
├── Single resource with relationships → self link + related resource links
├── Paginated collection → self, first, prev, next, last — all four navigation links
├── Created resource → self link for the new resource
├── Related resources → links to related resources (e.g., post.comments)
└── No navigation needed → self link only. Minimal but always present.
```

## Tree 4: Meta Consistency

```
Are all endpoints following the same meta structure?
├── YES, same structure everywhere → Define meta format in a global response macro or base class.
├── NO, different resources need different meta → Use a base structure (request_id, api_version) + per-resource additions.
├── NO, API version changes meta format → Version the meta structure through the versioned response base class.
└── NO, different clients need different meta → Include minimal meta by default. Add on request (?meta=all).
```

## Tree 5: Pagination Link Generation

```
Has the paginated collection reached certain states?
├── First page (page=1) → links: { self, first, next, last }. Omit prev.
├── Middle page → links: { self, first, prev, next, last }. All four navigation links.
├── Last page → links: { self, first, prev, last }. Omit next.
├── Single page (total ≤ per_page) → links: { self }. No pagination links needed.
└── Empty collection → links: { self }. Empty data array. Include pagination meta with total=0.
```
