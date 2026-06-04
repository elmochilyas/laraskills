# Decision Trees — Not Found Error Responses

## Tree 1: 404 vs 403 Strategy

**Decision Context**: Choosing whether to return 404 (pretend resource doesn't exist) or 403 (resource exists but denied) when an authenticated user lacks access to a resource.

**Decision Criteria**:
- Resource sensitivity
- Enumeration risk
- Consistency requirement
- Application type (internal vs public)

**Decision Tree**:
```
Is this a public API where resource enumeration is a realistic threat?
├── YES → Use 404 consistently for all access-denied + not-found scenarios — prevents probing
└── NO → Is this an internal/private API?
    ├── YES → Use 403 for access denied (honest about existence), 404 for truly missing — aids debugging
    └── NO → Is there already a mixed strategy in the codebase?
        ├── YES → Choose one strategy and apply consistently across ALL endpoints
        └── NO → Use 404 consistently — safest default for consumer-facing APIs
```

**Rationale**: The single most important rule is consistency within a resource type. Mixed 403/404 for the same resource enables attackers to map existence.

**Recommended Default**: 404 for public APIs (prevents enumeration). 403 for private/internal APIs (aids debugging).

**Risks**: 403 everywhere confirms existence and enables enumeration. 404 everywhere frustrates legitimate debugging of access control issues.

---

## Tree 2: Resource Type Exposure

**Decision Context**: Whether to include the resource type in 404 detail.

**Decision Criteria**:
- Enumeration risk level
- Client need for context-specific handling
- API type (public vs internal)

**Decision Tree**:
```
Is this a public API where revealing resource type aids enumeration?
├── YES → Omit resource_type from detail — return generic "The requested resource was not found."
└── NO → Is the API internal with trusted consumers?
    ├── YES → Include resource_type — helps debugging and client error handling
    └── NO → Is there a mix of public and internal routes?
        ├── YES → Include resource_type only for authenticated, authorized requests; omit for unauthenticated
        └── NO → Include resource_type — moderate-consistency API can provide helpful detail
```

**Rationale**: Resource type helps clients show context-specific error UIs but also reveals what resources exist. Balance based on enumeration risk.

**Recommended Default**: Internal APIs: include resource_type. Public APIs: omit resource_type.

**Risks**: Including resource_type enables resource enumeration. Omitting it forces clients to handle all 404s generically.
