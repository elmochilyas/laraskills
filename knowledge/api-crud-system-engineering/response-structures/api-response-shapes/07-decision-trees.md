# Decision Trees: Response Structure Formats

## Tree 1: Envelope vs Bare Body

```
Who are the primary API consumers?
├── External developers / public API → Envelope response. Self-describing, metadata-rich.
├── Internal team services → Bare body. Simpler, fewer bytes.
├── Mobile apps → Envelope. Request ID for debugging, pagination links for navigation.
└── Single-consumer (yours) → Bare body. You control both sides.
```

## Tree 2: Response Shape Decision

```
Which response format is needed?
├── Simple data response → { "data": { "id": 1, "name": "Alice" }, "meta": { "request_id": "..." } }
├── Paginated list → { "data": [...], "meta": { "current_page": 1, "per_page": 15, "total": 57 }, "links": { "first": "...", "prev": null, "next": "...", "last": "..." } }
├── Error response → { "error": { "code": "VALIDATION_001", "message": "The name field is required.", "details": [...] } }
└── Deleted/no-content → 204 No Content (no body)
```

## Tree 3: Compression Decision

```
What is the average response size?
├── < 1KB → Compression overhead may exceed savings. Consider no compression.
├── 1KB - 10KB → Enable gzip level 1. Compression helps.
├── 10KB - 100KB → Enable brotli or gzip level 3. Significant bandwidth savings.
└── > 100KB → Always compress. Use brotli if supported.
```
