# Decision Trees — Media Type Versioning

## Tree 1: Media Type Format Selection

**Decision Context**: Choosing the vendor MIME type format — version inside the media type vs version as a parameter.

**Decision Criteria**:
- IANA registration requirements
- Format independence (JSON vs XML vs other)
- Client library generation support

**Decision Tree**:
```
Does the API support multiple serialization formats (JSON, XML, MessagePack)?
├── YES → Use version + format in media type: application/vnd.myapp.v2+json, vnd.myapp.v2+xml
└── NO → Is the API public with IANA-registered media types?
    ├── YES → Standard vendor MIME: application/vnd.myapp.v2+json (register with IANA)
    └── NO → Use simpler format: application/vnd.myapp.v2+json without IANA registration (document in OpenAPI spec)
```

**Rationale**: The `+format` suffix cleanly separates version from serialization format. IANA registration is recommended for public APIs but not strictly required.

**Recommended Default**: `application/vnd.myapp.v2+json` with documented format in OpenAPI spec.

**Risks**: Unregistered media types may collide with other applications. Multiple format suffixes increase transformer maintenance.

---

## Tree 2: Content Negotiation Failure Handling

**Decision Context**: How to handle Accept headers that don't match any supported media type.

**Decision Criteria**:
- Wildcard Accept handling
- Error response format
- Consumer debugging support

**Decision Tree**:
```
Does the Accept header contain */* (wildcard)?
├── YES → Default to the latest stable version's media type; include response Content-Type indicating the resolved type
└── NO → Does the Accept header contain a known vendor MIME but unsupported version?
    ├── YES → Return 406 Not Acceptable with:
    │   - List of supported media types in response body
    │   - Link to API documentation for version negotiation
    └── NO → Does the Accept header contain an unrecognized pattern?
        ├── YES → Return 406 with list of supported media types
        └── NO → Return 406 with API documentation URL
```

**Rationale**: Wildcard Accept (from browsers and generic HTTP clients) should default to latest. Specific unsupported versions should return actionable 406 responses.

**Recommended Default**: `*/*` → default to latest. `application/vnd.myapp.v99+json` → 406 with supported versions list.

**Risks**: Defaulting to latest on wildcard Accept may surprise clients expecting a specific version. 406 without supported versions list is not actionable.
