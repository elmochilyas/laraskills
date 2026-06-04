# Decision Trees — Request Size Limits

## Tree 1: Limit Configuration by Layer

**Decision Context**: Setting request size limits across infrastructure layers (nginx, PHP, Laravel) — how to distribute limits for defense in depth while avoiding waste.

**Decision Criteria**:
- Expected request payload sizes
- Upload endpoint requirements
- Resource constraints (memory, CPU)
- Consumer tier differentiation

**Decision Tree**:
```
Is the endpoint a file upload endpoint?
├── YES → Set nginx limit to maximum expected upload size (e.g., 50MB) + account for multipart overhead
│        Set PHP post_max_size = nginx limit + 10% overhead
│        Set upload_max_filesize = target file size (e.g., 50MB)
│        Set Laravel middleware limit = PHP limit (same or more permissive)
└── NO → Is the endpoint a standard JSON mutation?
    ├── YES → Set nginx = 1MB (default body limit for mutations)
    │        Set PHP post_max_size = 2MB (matching/greater)
    │        Set Laravel = 2MB (same as PHP or more permissive)
    └── NO → Is the endpoint bulk/batch?
        ├── YES → Set nginx = 10MB (bulk operations need larger payloads)
        │        Set PHP = 12MB; Laravel = 12MB
        └── NO → Use standard limits: nginx 10MB, PHP 12MB, Laravel 12MB
```

**Rationale**: Limits should be strictest at nginx (outermost), relaxing inward. This rejects oversized requests with minimal resource consumption.

**Recommended Default**: nginx `client_max_body_size 10M`, PHP `post_max_size 12M`, `upload_max_filesize 50M` for upload endpoints.

**Risks**:
- Inner layer stricter than outer wastes resources processing doomed requests
- Upload limits too low break legitimate file uploads
- Limits too high enable DoS via large payloads

**Related Rules/Skills**: Rules: Enforce Strictest Limit at Outermost Layer (nginx), Use Tiered Limits Per Consumer. Skills: Enforce Request Size Limits.

---

## Tree 2: Tier-Based Limit Assignment

**Decision Context**: How to assign different request size limits per consumer tier — whether to use tier-based, endpoint-based, or consumer-specific limits.

**Decision Criteria**:
- Consumer tier (Free, Pro, Enterprise)
- Endpoint type (upload, mutation, batch)
- Business requirements and pricing
- Infrastructure capacity

**Decision Tree**:
```
Does the consumer have a defined tier (Free/Pro/Enterprise)?
├── YES → Is the endpoint a file upload?
│   ├── YES → Apply tiered upload limit:
│   │   Free: 5MB, Pro: 50MB, Enterprise: 200MB
│   └── NO → Apply tiered body limit:
│       Free: 1MB, Pro: 10MB, Enterprise: 50MB
└── NO → Is the consumer internal/trusted?
    ├── YES → Apply internal limit (e.g., 100MB); monitor for abuse
    └── NO → Apply default limit (Free tier by default until authenticated)
```

**Rationale**: Tier-based limits align resource allocation with business value. Free-tier consumers get lower limits; enterprise consumers get higher limits for their use cases.

**Recommended Default**: Free: 1MB body / 5MB upload; Pro: 10MB body / 50MB upload; Enterprise: 50MB body / 200MB upload.

**Risks**:
- Single limit for all tiers allows free-tier abuse
- Limits too restrictive for enterprise use cases block revenue
- Upload limits without streaming cause memory exhaustion

**Related Rules/Skills**: Rules: Use Tiered Limits Per Consumer, Return 413 with Limit Info and Upgrade Path. Skills: Enforce Request Size Limits.

---

## Tree 3: Error Response Strategy for Oversized Requests

**Decision Context**: How to communicate request size violations to consumers — what information to include in 413 responses and how to inform consumers proactively.

**Decision Criteria**:
- Consumer visibility into limits
- Error response usability
- Support ticket reduction
- Upgrade path clarity

**Decision Tree**:
```
Does the oversized request come from an authenticated consumer?
├── YES → Return 413 with:
│   - Current limit (tier-specific)
│   - Actual request size
│   - Upgrade path ("Upgrade to Pro for 10MB limit")
│   - Link to documentation
│   Include X-Content-Length-Limit header
└── NO → Is this a pre-authentication request (login, register)?
    ├── YES → Return 413 with standard limit info (no tier upgrade path)
    └── NO → Has the consumer exceeded the limit before?
        ├── YES → Consider rate limiting or temporary block if repeated violations
        └── NO → Return 413 with limit info; include X-Content-Length-Limit header
```

**Rationale**: Authenticated consumers should see tier-specific limits and upgrade paths. Anonymous consumers get standard limit information. Proactive headers reduce 413 encounters.

**Recommended Default**: 413 response with `code`, `message`, `limit`, `actual_size`, `resolution` fields plus `X-Content-Length-Limit` header on all responses.

**Risks**:
- Bare 413 without context forces consumers to search documentation
- No upgrade path misses monetization opportunity
- No proactive limit header means consumers discover limits by hitting them

**Related Rules/Skills**: Rules: Return 413 with Limit Info and Upgrade Path. Skills: Enforce Request Size Limits.
