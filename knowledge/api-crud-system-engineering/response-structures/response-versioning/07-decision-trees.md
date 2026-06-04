# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Response Structures
**Knowledge Unit:** Response Versioning
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Version Manifestation Strategy

---

### Decision Context

Choosing how to express API version (URL prefix, Accept header, query parameter, or subdomain) based on client capabilities and infrastructure.

---

### Decision Criteria

* architectural
* maintainability
* security

---

### Decision Tree

Do clients need to easily cache and route by version (CDN, proxy)?
├── YES → Use URL prefix versioning (`/api/v1/users`, `/api/v2/users`)
│   ├── Is route file organization a priority?
│   │   ├── YES → Separate route files per version: `routes/api/v1.php`, `routes/api/v2.php`
│   │   └── NO → Group within single route file with prefix
│   └── Do mobile apps need to hardcode version URLs?
│       ├── YES → URL prefix is the most explicit and hardest to misconfigure
│       └── NO → URL prefix still recommended for simplicity
└── NO → Are clients using generic HTTP libraries that support custom headers?
    ├── YES → Accept header versioning (`Accept: application/vnd.api.v2+json`)
    │   ├── Cleaner URLs, but requires client-side header configuration
    │   └── Must validate Accept header format to prevent injection
    └── NO → Query parameter (`?api_version=2`) — simplest but pollutes URLs
        └── Bypasses CDN caching if parameter is excluded from cache key

---

### Rationale

URL prefix versioning is the most explicit and cache-friendly approach. Accept header versioning produces cleaner URLs but requires client-side header configuration. Query parameter versioning is simplest to implement but pollutes URLs and complicates caching.

---

### Recommended Default

**Default:** URL prefix versioning (`/api/v1/`, `/api/v2/`) with separate route files
**Reason:** Most explicit, easiest to cache, simplest to implement and understand.

---

### Risks Of Wrong Choice

Accept header misconfiguration causes version mismatch. Query parameter versioning bypasses CDN caching. URL prefix versioning ties version to URL structure (harder to change).

---

### Related Rules

* Require Explicit Version Specification
* Use Separate Resource Classes per Version

---

### Related Skills

* Implement Response Versioning Strategy
* Resource Controller Organization by Version

---

---

## Versioned Resource Class Strategy

---

### Decision Context

Choosing between separate resource classes per version, conditional branching in a single resource, or shared base classes with version-specific overrides.

---

### Decision Criteria

* maintainability
* reliability
* code organization

---

### Decision Tree

Is the change between versions additive only (new fields, nothing removed)?
├── YES → Can use shared base class with extensions
│   ├── New fields added in new version as optional
│   └── Old fields preserved in the same base class
└── NO → Does the change include field removal or rename?
    ├── YES → Use separate resource classes per version (fork)
    │   ├── Are there common fields shared across all versions?
    │   │   ├── YES → Extract shared fields into a base class; extend in version-specific classes
    │   │   └── NO → Standalone per-version resource classes
    │   └── Is there conditional `if (version === 'v1')` logic in the resource?
    │       ├── YES → Refactor: extract to separate classes
    │       └── NO → Separate classes already — good
    └── NO → Does the change include type changes (string to int, field restructuring)?
        ├── YES → Separate resource classes per version
        └── NO → Shared base class with adjustments

---

### Rationale

Separate resource classes per version isolate version concerns, prevent cross-version mutation, and make each version independently testable. Conditional branching scatters version logic and creates risk of V1 changes affecting V2.

---

### Recommended Default

**Default:** Separate resource classes per version with a shared base class for common fields
**Reason:** Forked classes isolate version concerns; shared base prevents duplication of common transformation logic.

---

### Risks Of Wrong Choice

Conditional branching causes V1 changes to accidentally affect V2. Copy-pasted code between versions drifts apart. Cannot fully remove V1 code without auditing all branches.

---

### Related Rules

* Use Separate Resource Classes per Version
* Share Base Logic via Inheritance, Not Conditional Branches

---

### Related Skills

* Resource Controller Organization by Version
* API Resource Transformation

---

---

## Sunset and Deprecation Strategy

---

### Decision Context

Planning the lifecycle of API versions including deprecation notification, sunset timeline, and migration support.

---

### Decision Criteria

* maintainability
* security
* reliability

---

### Decision Tree

Is the API version in active development by clients?
├── YES → Is there a newer version available?
│   ├── YES → Is the old version scheduled for sunset?
│   │   ├── YES → Include `Deprecation: true` and `Sunset` headers on every response
│   │   │   ├── Sunset date should allow minimum 6 months migration window
│   │   │   └── Document migration guide in API docs
│   │   └── NO → Plan sunset date at version creation time
│   └── NO → Active version — no deprecation headers needed
└── NO → Is the version past its sunset date?
    ├── YES → Has the version been force-sunset?
    │   ├── YES → Return 410 Gone with clear migration instructions
    │   └── NO → Force-sunset immediately: return 410 Gone
    └── NO → Continue serving with deprecation warnings

---

### Rationale

Clients need programmatic deprecation signals (`Deprecation` and `Sunset` headers) and sufficient migration windows (minimum 6 months) to update their code. Force-sunsetting without warning breaks production clients. Indefinite version support creates unsustainable maintenance burden.

---

### Recommended Default

**Default:** 12-month version lifecycle: 6 months active + 6 months deprecated with headers; force-sunset returns 410 Gone
**Reason:** 12 months gives clients adequate migration window while limiting maintenance burden; 410 Gone provides clear feedback.

---

### Risks Of Wrong Choice

No deprecation headers cause clients to discover sunset when the version is removed. Indefinite version support creates exponential maintenance burden. Short migration windows (under 3 months) break clients with slow deployment cycles.

---

### Related Rules

* Include `Deprecation` and `Sunset` Headers on Deprecated Versions
* Keep Database Schema Version-Agnostic

---

### Related Skills

* Response Format Decision Framework
* API Versioning
