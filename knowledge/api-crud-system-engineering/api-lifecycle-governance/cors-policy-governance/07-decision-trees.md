# Decision Trees — CORS Policy Governance

## Tree 1: Origin Allowlist Strategy

**Decision Context**: Choosing how to manage allowed origins — static environment-specific lists vs dynamic per-tenant origin validation vs wildcard usage.

**Decision Criteria**:
- Authentication requirements (credentials flag)
- Number of allowed origins
- Multi-tenant architecture
- Environment (dev, staging, production)

**Decision Tree**:
```
Are you handling authenticated requests (withCredentials/cookies)?
├── YES → Is the API multi-tenant with tenant-specific origins?
│   ├── YES → Dynamic origin validation: validate against tenant-specific database allowlist; cache in memory
│   └── NO → Static environment-specific origin list from env vars
└── NO → Is the endpoint public and read-only (no auth needed)?
    ├── YES → Can you accept any origin?
    │   ├── YES → Use `Access-Control-Allow-Origin: *` (public read-only only)
    │   └── NO → Use explicit origin list with origin echoing
    └── NO → Use explicit origin list (safe default even without auth)
```

**Rationale**: Wildcards are only safe for public read-only endpoints. Authenticated endpoints require explicit origins. Multi-tenant SaaS needs dynamic validation.

**Recommended Default**: Environment-specific explicit origin lists with origin echoing for authenticated endpoints. Never wildcard with credentials.

**Risks**:
- Wildcard with credentials is rejected by browsers
- Static lists don't scale for multi-tenant SaaS
- Dynamic validation adds latency without caching

**Related Rules/Skills**: Rules: Never Use Wildcard Origin with Credentials, Use Environment-Specific Origin Lists. Skills: Govern CORS Policy.

---

## Tree 2: Preflight Handling and Caching

**Decision Context**: How to handle CORS preflight (OPTIONS) requests — gateway-level vs application-level handling, and what Max-Age to set.

**Decision Criteria**:
- Request complexity (simple vs preflighted)
- Gateway capabilities (nginx, API gateway)
- Origin policy change frequency
- Performance requirements

**Decision Tree**:
```
Does your gateway (nginx, API gateway) support custom OPTIONS responses?
├── YES → Handle preflight at gateway level for performance; 24h Max-Age cache
└── NO → Is preflight overhead acceptable for your traffic volume?
    ├── YES → Handle preflight in application middleware; 24h Max-Age
    └── NO → Are you changing origin policies frequently (>monthly)?
        ├── YES → Reduce Max-Age to 1 hour during transition period, restore to 24h when stable
        └── NO → Keep 24h Max-Age; set to 0 only during active policy migrations
```

**Rationale**: Gateway-level preflight handling is more performant and avoids application processing for OPTIONS requests. 24h Max-Age balances cache benefit with policy update agility.

**Recommended Default**: Gateway-level preflight handling (nginx) with `Access-Control-Max-Age: 86400`.

**Risks**:
- Too short Max-Age increases preflight volume
- Too long Max-Age delays policy propagation during changes
- Application-level handling adds latency to every OPTIONS request

**Related Rules/Skills**: Rules: Cache Preflight Responses for 24 Hours. Skills: Govern CORS Policy.

---

## Tree 3: Origin Addition Governance Process

**Decision Context**: How to manage the process of adding new origins to the production allowlist — formal review vs self-service vs automated approval.

**Decision Criteria**:
- Security requirements
- Number of origin addition requests
- Consumer onboarding velocity needs
- Audit/compliance requirements

**Decision Tree**:
```
Is the origin for production use?
├── YES → Does the origin serve authenticated content?
│   ├── YES → Formal process: security review + business justification + change request; quarterly audit
│   └── NO → Light review: verify origin ownership and security posture; document in allowlist
└── NO → Is the origin for development/staging?
    ├── YES → Self-service via env config (localhost:* allowed in dev only); no formal review needed
    └── NO → Reject; non-standard environment requires discussion
```

**Rationale**: Production origins for authenticated content have security implications requiring formal review. Dev origins should be self-service for developer velocity.

**Recommended Default**: Production origin additions require security review and business justification, documented in change request.

**Risks**:
- No review process allows malicious origins to be added
- Overly burdensome review slows down legitimate consumer onboarding
- Without quarterly audit, unused origins accumulate and expand attack surface

**Related Rules/Skills**: Rules: Use Environment-Specific Origin Lists. Skills: Govern CORS Policy, Conduct API Audit Reviews.
