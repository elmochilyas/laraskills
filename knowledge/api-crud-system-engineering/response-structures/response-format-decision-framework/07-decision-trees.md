# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Response Structures
**Knowledge Unit:** Response Format Decision Framework
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Primary Response Format Selection

---

### Decision Context

Choosing between envelope, bare-body, JSON:API, and RFC 9457 formats for the primary API response based on consumer profiles and architectural constraints.

---

### Decision Criteria

* architectural
* security
* maintainability
* performance

---

### Decision Tree

Are API consumers primarily unknown third-party clients?
├── YES → Is there existing client tooling that expects JSON:API?
│   ├── YES → Use JSON:API for resources (type, id, attributes, relationships)
│   └── NO → Use envelope format (`data`, `meta`, `links`)
└── NO → Are all consumers known and controlled by the same team?
    ├── YES → Is bandwidth constrained (IoT, mobile metered)?
    │   ├── YES → Use bare-body for primary resources
    │   └── NO → Use envelope for extensibility
    └── NO → Is this a BFF with an API gateway?
        ├── YES → Use bare-body internally; gateway adds envelope
        └── NO → Use envelope (safe default)

What format should error responses use regardless of success format?
├── Use RFC 9457 Problem Details for ALL 4xx/5xx responses
└── Exceptions: Legacy clients with existing error parsing

---

### Rationale

Format selection depends on consumer diversity, bandwidth constraints, and tooling ecosystem. Envelope is the safe default for public APIs. Bare-body optimizes for known consumers. JSON:API serves specification-compliant ecosystems. RFC 9457 errors should be universal regardless of success format.

---

### Recommended Default

**Default:** Envelope for resources + RFC 9457 for errors; optimize to bare-body only when measured performance proves it necessary
**Reason:** Start with extensible format (envelope); optimize later; errors should always follow the standard.

---

### Risks Of Wrong Choice

Envelope on internal APIs wastes bandwidth. Bare-body on public APIs creates future breaking changes. JSON:API on simple APIs adds spec overhead without benefit. Custom error formats break API gateway integration.

---

### Related Rules

* Lock Response Format to API Version
* Use RFC 9457 for ALL Error Responses Regardless of Success Format

---

### Related Skills

* Choose JSON Response Format Based on Client and Context
* Envelope Response Design

---

---

## Format Application Layer

---

### Decision Context

Deciding whether to apply response format transformation via middleware, base controller, or per-endpoint logic.

---

### Decision Criteria

* code organization
* maintainability
* reliability

---

### Decision Tree

Is there a middleware layer that runs after controller execution?
├── YES → Apply format transformation in middleware
│   ├── Does the middleware adjust response based on Accept header content negotiation?
│   │   ├── YES → Middleware detects format from Accept header transforms accordingly
│   │   └── NO → Middleware applies a fixed format per route group
│   └── Are there endpoints that need different formats?
│       ├── YES → Route-group middleware per format variant
│       └── NO → Single middleware for all endpoints
└── NO → Is there a base controller or base resource class?
    ├── YES → Apply format at the base class level
    └── NO → Apply per-endpoint (acceptable only for <5 endpoints)

---

### Rationale

Controllers should be format-agnostic — they return data, not format. Middleware decouples format logic from business logic, making format changes possible without touching controllers. Route-group middleware enables format variation per version.

---

### Recommended Default

**Default:** Middleware transforms responses into the selected format; controllers return Resource instances
**Reason:** Middleware decouples format from business logic; format changes don't require controller modifications.

---

### Risks Of Wrong Choice

Per-endpoint format logic creates inconsistencies. Controllers mixed with format logic are harder to refactor. Missing format transformation produces raw controller output.

---

### Related Rules

* Apply Format Transformation at Middleware Layer
* Never Determine Format via User-Agent or Client Sniffing

---

### Related Skills

* Content Negotiation
* Response Versioning

---

---

## Hybrid Format Strategy

---

### Decision Context

Deciding whether to use different response formats for different aspects of the API (resources vs errors vs pagination metadata) within the same version.

---

### Decision Criteria

* architectural
* maintainability

---

### Decision Tree

Are resources served in a different format than errors?
├── YES → Document the hybrid approach explicitly
│   ├── Resources: JSON:API or Envelope
│   ├── Errors: RFC 9457 Problem Details
│   └── Pagination metadata: Envelope meta object
└── NO → Unified format for all response types

Does the API include paginated collections?
├── YES → Include pagination metadata in envelope `meta` object
│   └── Does the pagination metadata format differ from resource format?
│       ├── YES → Document the inconsistency; consider unifying
│       └── NO → Consistent format across all response aspects
└── NO → No pagination metadata needed

---

### Rationale

Hybrid formats (JSON:API resources + RFC 9457 errors) are standard and defendable. Different response concerns benefit from different optimizations. The key is documenting the hybrid approach so clients know which parser to use for each response aspect.

---

### Recommended Default

**Default:** JSON:API or envelope for resources; RFC 9457 for errors; envelope meta for pagination
**Reason:** Resources benefit from rich structure; errors benefit from machine-readable taxonomy; pagination metadata is simple enough for envelope format.

---

### Risks Of Wrong Choice

Undocumented hybrid formats confuse clients. Inconsistent format application across endpoints creates parsing bugs.

---

### Related Rules

* Return 406 Not Acceptable for Unsupported Formats
* Start with Envelope, Optimize to Bare-Body Only When Measured

---

### Related Skills

* RFC 9457 Problem Details
* JSON:API Resource Structure
