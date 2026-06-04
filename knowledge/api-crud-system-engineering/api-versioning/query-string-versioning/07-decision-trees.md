# Decision Trees: Query String Versioning

## Tree 1: Version Resolution

```
Does the request include a version query parameter?
├── YES → Is the value a positive integer within supported range?
│   ├── YES → Use explicitly requested version. Set X-Api-Version header.
│   └── NO → Return 400 Bad Request. Explain valid format.
└── NO (parameter missing) → Apply default version
    ├── Default configured → Use configured default
    └── No default → Use latest stable version. Always set X-Api-Version.
```

## Tree 2: Versioning Strategy Comparison

```
Who are the primary API consumers?
├── Internal team services → Query string is acceptable. Simple and fast.
├── External developers → URL path versioning preferred. More RESTful.
├── Mobile apps → URL path versioning. Deep linking requires stable URLs.
└── Partners with SLA → Media type or header versioning. More explicit.
```

## Tree 3: Cache Strategy With Query String

```
Does the API use extensive caching (CDN, Redis, HTTP)?
├── YES, heavy caching → Query string versioning fragments caches. Consider URL path versioning.
│   ├── Can CDN normalize query params? → Use CDN normalization to reduce fragmentation.
│   └── Cannot normalize → URL path versioning recommended.
├── NO, minimal caching → Query string versioning is fine.
└── Moderate caching → Use X-Api-Version header instead of query param for cache-friendly versioning.
```
