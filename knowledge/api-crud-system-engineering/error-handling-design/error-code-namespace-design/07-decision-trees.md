# Decision Trees — Error Code Namespace Design

## Tree 1: Namespace Depth Decision

**Decision Context**: Choosing the depth of the error code namespace — `DOMAIN.VERB` vs `DOMAIN.SUBDOMAIN.VERB_OBJECT`.

**Decision Criteria**:
- Number of codes per domain
- Domain complexity
- Collision risk within domains

**Decision Tree**:
```
Does the domain have more than 20 error codes?
├── YES → Use 2-level namespace: DOMAIN.SUBDOMAIN (e.g., USER.AUTH_, USER.PROFILE_)
└── NO → Does the domain have distinct subsystems with their own error patterns?
    ├── YES → Use 2-level namespace to group by subsystem
    └── NO → Use 1-level namespace: DOMAIN.VERB_OBJECT (e.g., USER.NOT_FOUND, USER.ALREADY_EXISTS)
```

**Rationale**: Namespace depth should reflect organizational complexity. Flat namespaces are simpler for small domains; hierarchical namespaces prevent collision in large domains.

**Recommended Default**: `DOMAIN.VERB_OBJECT` for domains <20 codes. `DOMAIN.SUBDOMAIN.VERB_OBJECT` for domains with distinct subsystems.

**Risks**: 3+ level namespaces become unwieldy. Flat namespaces in large domains risk naming collisions.

---

## Tree 2: Cross-Domain Code Placement

**Decision Context**: Where to place an error code that spans multiple domains (e.g., rate limiting, validation).

**Decision Criteria**:
- Scope (affects all domains vs specific domains)
- Team ownership
- Consumer grouping expectations

**Decision Tree**:
```
Does the error affect all domains equally (rate limiting, internal error, validation)?
├── YES → Use a SYSTEM or SHARED namespace prefix — SYSTEM.RATE_LIMITED, SYSTEM.INTERNAL_ERROR
└── NO → Is the error specific to one domain but uses a common pattern?
    ├── YES → Use the specific domain prefix — USER.NOT_FOUND, ORDER.NOT_FOUND
    └── NO → Is the error shared by a subset of domains?
        ├── YES → Use SHARED namespace with subsystem grouping — SHARED.PAYMENT.DECLINED
        └── NO → Use the owning domain's namespace
```

**Rationale**: Cross-domain codes should be in SYSTEM or SHARED namespaces so consumers know they apply regardless of domain context.

**Recommended Default**: System-wide → SYSTEM. Domain-specific → DOMAIN.

**Risks**: Placing cross-domain codes in one domain's namespace misleads consumers about scope. Creating too many SHARED sub-namespaces creates a catch-all category.
