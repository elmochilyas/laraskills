# Decision Trees: Media Type Version Negotiation

## Tree 1: Client Accept Header Handling

```
What Accept header did the client send?
├── application/vnd.api+json; version=2 → Exact match → Serve version 2
├── application/vnd.api+json → No version specified → Apply default version
│   ├── Default configured → Serve default version
│   └── No default → Apply latest stable version
├── application/json → Generic JSON → Apply latest stable version
├── */* → Wildcard → Apply latest stable version
├── application/vnd.v99+json → Unsupported version → Return 406
└── Invalid/unparseable → Malformed header → Return 400
```

## Tree 2: Versioning Strategy Selection

```
Do URLs need to remain stable across versions?
├── YES, URL stability is critical
│   ├── Clients can control Accept headers → Media type version negotiation
│   └── Clients cannot control Accept headers → URL path versioning
├── NO, URL stability is not critical
│   ├── Simple API, few consumers → Query string versioning
│   └── Public API, many consumers → URL path versioning
└── YES, but Vary: Accept cache splitting is unacceptable
    ├── Yet → Consider header-based versioning (X-Api-Version)
    └── No → URL path versioning with cache-friendly URLs
```

## Tree 3: Cache Strategy With Vary: Accept

```
How many API versions are supported?
├── 1-2 versions → Vary: Accept is manageable. Standard caching works.
├── 3-5 versions → Consider cache tags per version. Vary: Accept with version-specific cache keys.
└── 5+ versions → Vary: Accept may fragment cache too much. Evaluate URL-based versioning or Accept-version header instead.
```
