# Decision Trees — Header-Based Versioning

## Tree 1: Header Type Selection

**Decision Context**: Choosing between custom header (X-API-Version), Accept header with vendor MIME, or combined approach.

**Decision Criteria**:
- Client header control (mobile apps, browser JS, server-to-server)
- Proxy/gateway compatibility
- REST purity requirements

**Decision Tree**:
```
Are consumers primarily server-to-server with full header control?
├── YES → Use Accept header with vendor MIME type (application/vnd.myapp.v1+json) — most REST-pure
└── NO → Are consumers primarily mobile apps or browser-based?
    ├── YES → Use custom header (X-API-Version) — simpler, easier to debug, works with limited header control
    └── NO → Is CDN caching a concern (Vary: Accept required)?
        ├── YES → Custom header (X-API-Version) — avoids Accept-based cache fragmentation
        └── NO → Accept header with vendor MIME — standard approach
```

**Rationale**: Custom headers are simpler for most consumers. Accept header versioning is more REST-pure but requires Vary: Accept and has CDN implications.

**Recommended Default**: Custom header `X-API-Version` for most use cases; Accept header with vendor MIME for REST-pure public APIs.

**Risks**: Custom headers may be stripped by proxies/gateways. Accept header versioning splits CDN cache. Header parsing errors can silently default to wrong version.

---

## Tree 2: Version Resolution Fallback

**Decision Context**: How to resolve the API version when the header is missing, malformed, or requests an unsupported version.

**Decision Criteria**:
- Failure behavior preference (fail open vs fail closed)
- Consumer onboarding experience
- Security requirements

**Decision Tree**:
```
Is the version header missing entirely?
├── YES → Is this a public API that should be easy to explore?
│   ├── YES → Default to latest stable version; include response header indicating the resolved version
│   └── NO → Return 400/406 — version is required; include documentation links
└── NO → Is the version header malformed or requesting an unsupported version?
    ├── YES → Return 406 Not Acceptable with supported versions list and documentation URL
    └── NO → Valid version → proceed with resolved version
```

**Rationale**: Public APIs benefit from defaulting to the latest version for easy exploration. Internal/security-sensitive APIs should require explicit version specification.

**Recommended Default**: Public APIs: default to latest version on missing header. All APIs: return 406 for malformed/unsupported versions.

**Risks**: Defaulting to latest version on missing header may break clients that accidentally omit the header. Requiring version on missing header frustrates new developers.
