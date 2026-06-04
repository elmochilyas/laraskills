# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Response Structures
**Knowledge Unit:** JSON:API Resource Structure
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Full Compliance vs Pragmatic Subset

---

### Decision Context

Deciding whether to implement full JSON:API specification compliance or a pragmatic subset based on client requirements and development resources.

---

### Decision Criteria

* architectural
* maintainability
* performance

---

### Decision Tree

Do clients use JSON:API-native tools (Ember Data, Orbit.js, Redux normalizr)?
├── YES → Implement full compliance
│   ├── Include `type`, `id` (string), `attributes`, `relationships`, `links`, `included`
│   └── Does every endpoint need relationship objects for every relation?
│       ├── YES → Full relationship serialization
│       └── NO → Relationship objects only where clients need resource linkage
└── NO → Consider envelope response instead of JSON:API
    ├── Is payload size reduction a priority?
    │   ├── YES → Envelope or bare-body — JSON:API adds 20-40% overhead
    │   └── NO → Envelope with `data` wrapper — simpler than full JSON:API
    └── Would JSON:API structure benefit future clients?
        ├── YES → Adopt JSON:API subset now (type, id, attributes)
        └── NO → Use envelope format

---

### Rationale

JSON:API is a rich specification requiring significant boilerplate (relationship objects for every relation, resource linkage). Full compliance is only justified when clients rely on JSON:API features. A pragmatic subset provides the key benefits (type-id normalization) without the full overhead.

---

### Recommended Default

**Default:** Full JSON:API compliance for public APIs with diverse consumers; envelope format for internal/single-client APIs
**Reason:** JSON:API provides client normalization benefits; envelope provides simplicity with less boilerplate.

---

### Risks Of Wrong Choice

Partial compliance (claiming JSON:API but omitting required fields) breaks client tooling. Full compliance on bandwidth-constrained APIs adds unnecessary overhead.

---

### Related Rules

* Always Include `type` and `id` in Every Resource Object
* Always Cast `id` to String

---

### Related Skills

* Implement JSON:API Resource Structure
* Envelope Response Design

---

---

## Attributes vs Relationships Separation

---

### Decision Context

Determining whether a field belongs in `attributes` or `relationships` in the JSON:API resource structure.

---

### Decision Criteria

* design
* maintainability

---

### Decision Tree

Does the field reference another resource or resource collection?
├── YES → Belongs in `relationships` object
│   ├── Is the relationship data included in the response?
│   │   ├── YES → Include `data` with `type:id` resource linkage
│   │   └── NO → Include only `links` (self, related) without resource linkage
│   └── Is this a to-many relationship?
│       ├── YES → `data` is an array of `{type, id}` objects
│       └── NO → `data` is a single `{type, id}` object or null
└── NO → Belongs in `attributes` object
    ├── Is it the resource `id`?
    │   ├── YES → Place at resource top level, not in attributes
    │   └── NO → Place in `attributes` as scalar value
    └── Is it pagination or metadata?
        ├── YES → Belongs in top-level `meta`, not in resource attributes
        └── NO → Place in `attributes`

---

### Rationale

JSON:API defines `attributes` as containing only non-relationship fields. Mixing relationship data into `attributes` breaks client traversal logic that expects relationships in the designated section. `id` is a top-level member, not part of attributes.

---

### Recommended Default

**Default:** Scalar fields → `attributes`; related resource references → `relationships` with `data` linkage; `id` → resource top level
**Reason:** Strict separation enables client-side normalization and spec compliance.

---

### Risks Of Wrong Choice

Relationship data in `attributes` breaks JSON:API parsers. Attribute-name collisions between relationship-derived values and actual attributes cause client confusion.

---

### Related Rules

* Separate Attributes from Relationships
* Never Include Pagination Metadata in `attributes`

---

### Related Skills

* JSON:API Compound Documents
* API Resource Transformation

---

---

## Type Naming Convention

---

### Decision Context

Choosing a consistent naming convention for JSON:API `type` members across the entire API.

---

### Decision Criteria

* maintainability
* architectural

---

### Decision Tree

Is there an existing API with established type naming?
├── YES → Maintain consistency with existing convention, even if non-standard
│   └── Is a migration to spec-standard naming planned?
│       ├── YES → Dual-emit both old and new names during migration window
│       └── NO → Keep existing convention
└── NO → Use pluralized kebab-case (JSON:API recommendation)
    ├── Are type names derived from model names?
    │   ├── YES → Convert: `BlogPost` → `blog-posts`, `UserAccount` → `user-accounts`
    │   └── NO → Use domain-focused names, not database table names
    └── Are there type name conflicts between different domains?
        ├── YES → Prefix with domain: `cms-posts`, `forum-posts`
        └── NO → Use simple pluralized kebab-case

---

### Rationale

Type naming must be consistent across the entire API — changing a type name is breaking. Pluralized kebab-case is the JSON:API recommended convention, enabling predictable endpoint-to-type mapping and spec compliance.

---

### Recommended Default

**Default:** Pluralized kebab-case (`blog-posts`, `user-accounts`) matching the resource model name converted
**Reason:** Consistent naming enables client normalization and predictable type mapping; kebab-case is spec-compliant and readable in URLs.

---

### Risks Of Wrong Choice

Inconsistent type naming makes client normalization impossible. Model-name leakage exposes internal architecture. Changing type names later is a breaking change.

---

### Related Rules

* Use Pluralized Kebab-Case for Type Names
* Include Resource Linkage in Every Relationship

---

### Related Skills

* Resource Naming Conventions
* URL Structure Design
