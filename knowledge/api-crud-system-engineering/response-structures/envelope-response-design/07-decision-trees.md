# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Response Structures
**Knowledge Unit:** Envelope Response Design
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Envelope vs Bare-Body Selection

---

### Decision Context

Choosing between envelope response format (wrapping payload in `data`/`meta`/`links`/`errors`) and bare-body format for a given API context.

---

### Decision Criteria

* architectural
* security
* maintainability
* performance

---

### Decision Tree

Are there unknown or diverse client types consuming the API?
├── YES → Use Envelope
│   ├── Is metadata required alongside every response (pagination, permissions, timestamps)?
│   │   ├── YES → Envelope with auto-injected meta and links
│   │   └── NO → Envelope with minimal meta (request_id only)
│   └── Is the API multi-version?
│       ├── YES → Envelope shape stays stable; resource fields evolve within `data`
│       └── NO → Envelope with standard `data`/`meta`/`links`/`errors` keys
└── NO → Is the API consumed over bandwidth-constrained connections (IoT, mobile)?
    ├── YES → Consider bare-body with header-based metadata
    └── NO → Is this a BFF with an API gateway adding the envelope?
        ├── YES → Use bare-body internally; gateway adds envelope
        └── NO → Use envelope for consistency and future extensibility

---

### Rationale

Envelope decouples resource representation from transport metadata, enabling uniform client parsing regardless of endpoint. The 15-30% payload overhead is justified for public APIs where schema evolution and metadata transport are required.

---

### Recommended Default

**Default:** Envelope for public APIs; bare-body for internal microservices
**Reason:** Public APIs benefit from structural consistency and extensibility; internal APIs benefit from reduced overhead.

---

### Risks Of Wrong Choice

Bare-body on public APIs causes breaking changes on every schema modification. Envelope on internal APIs adds unnecessary payload overhead and nesting complexity.

---

### Related Rules

* Always Wrap Errors Under the `errors` Key
* Never Return Raw Arrays from Controllers

---

### Related Skills

* Implement Envelope Response Design
* Bare Body Response Design

---

---

## Envelope Application Layer

---

### Decision Context

Deciding whether to apply envelope formatting via centralized middleware, a base response class, or per-controller logic.

---

### Decision Criteria

* code organization
* maintainability
* reliability

---

### Decision Tree

Does every endpoint need the same envelope keys and metadata?
├── YES → Apply envelope at a centralized layer
│   ├── Is the envelope metadata static (request_id, timestamps) across all endpoints?
│   │   ├── YES → Use middleware that injects metadata after serialization
│   │   └── NO → Use base response class with `additional()` for resource-specific data
│   └── Are there resource-specific fields that differ per endpoint?
│       ├── YES → Use `additional()` on individual resource instances for resource-specific data
│       └── NO → Pure centralized layer — no per-resource overrides needed
└── NO → Are there only 2-3 endpoints?
    ├── YES → Per-controller envelope building may be acceptable (small surface)
    └── NO → Standardize on a centralized layer to prevent inconsistency as API grows

---

### Rationale

Per-controller envelope building guarantees inconsistency as the API grows. A centralized middleware or base class ensures every response follows the exact same envelope contract without requiring developer discipline on each endpoint.

---

### Recommended Default

**Default:** Centralized middleware for top-level envelope metadata (request_id, timestamps); `additional()` for resource-specific metadata
**Reason:** Middleware ensures 100% consistency for transport metadata; `additional()` enables per-resource flexibility within the envelope.

---

### Risks Of Wrong Choice

Per-controller envelope building creates inconsistent metadata across endpoints. Middleware that overwrites `data` key corrupts the resource payload.

---

### Related Rules

* Apply Envelope at a Centralized Layer
* Never Include Sensitive Data in `meta`

---

### Related Skills

* Top-Level Meta and Links
* Response Format Decision Framework

---

---

## Envelope Stability and Versioning

---

### Decision Context

Managing envelope shape changes across API versions to avoid breaking existing clients.

---

### Decision Criteria

* architectural
* maintainability

---

### Decision Tree

Does the change add a new top-level key to the envelope?
├── YES → Is this a new API version?
│   ├── YES → New top-level keys are acceptable in the new version
│   └── NO → New top-level keys are additive but may confuse existing clients — document as experimental
└── NO → Does the change rename or remove an existing top-level key?
    ├── YES → Is this a major version bump?
    │   ├── YES → Rename/remove as part of the version contract change
    │   └── NO → Do NOT rename/remove — this is always a breaking change within a version
    └── NO → Does the change add fields inside `meta` or `links`?
        ├── YES → Additive changes to `meta`/`links` are backward-compatible
        └── NO → Verify the change is truly additive within the envelope

---

### Rationale

The envelope is the outermost contract between server and client. Changing envelope keys within a version is always a breaking change. New keys in `meta` or `links` are additive and backward-compatible; new top-level keys are not.

---

### Recommended Default

**Default:** Keep envelope keys (`data`, `meta`, `links`, `errors`) stable across all minor/patch versions; only change on major version bumps
**Reason:** The envelope is the first thing clients parse — any change there breaks every client simultaneously.

---

### Risks Of Wrong Choice

Renaming `links` to `navigation` within a version crashes every existing client. Adding a new top-level key is technically backward-compatible but may cause older clients to ignore important metadata.

---

### Related Rules

* Keep the Envelope Shape Stable Across Versions
* Enforce 204 No Content Without an Envelope Body

---

### Related Skills

* Response Versioning
* JSON:API Resource Structure
