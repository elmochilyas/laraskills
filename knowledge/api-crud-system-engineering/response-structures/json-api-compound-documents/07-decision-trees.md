# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Response Structures
**Knowledge Unit:** JSON:API Compound Documents
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Include Allowlist and Depth Control

---

### Decision Context

Determining which relationships clients can request via `?include=` and how to limit include depth to prevent DoS and data leakage.

---

### Decision Criteria

* security
* performance
* architectural

---

### Decision Tree

Does the `include` parameter accept any relationship name from the client?
├── YES → Define an explicit allowlist of includable relationships per resource
│   ├── Is the requested include on the allowlist?
│   │   ├── YES → Pass to `->with()` in the controller
│   │   └── NO → Silently ignore or return 400 Bad Request
│   └── Is the dot-notation include depth within the limit (max 3 levels)?
│       ├── YES → Process the include
│       └── NO → Return 400 or truncate to max depth
└── NO → Default response — no `included` key in response

Does the allowlist cover nested relationships (e.g., `author.profile`)?
├── YES → Validate each segment of dot-notation includes
└── NO → Allow only top-level relationships (simpler, safer)

---

### Rationale

Arbitrary includes expose deep relationship chains that may include sensitive data and cause DoS via deep inclusion. An allowlist ensures only documented, authorized relationships can be embedded. Depth limits prevent exponential query and serialization cost.

---

### Recommended Default

**Default:** Define `$allowedIncludes` per resource; enforce max 3 levels depth; reject invalid includes with 400
**Reason:** Allowlist prevents data leakage; depth limit prevents runaway query cost; early rejection avoids wasted resources.

---

### Risks Of Wrong Choice

No allowlist allows clients to request sensitive relationship chains. No depth limit allows `?include=a.b.c.d.e.f` causing database joins and serialization timeouts.

---

### Related Rules

* Always Enforce an Include Allowlist
* Limit Include Depth to at Most Three Levels

---

### Related Skills

* Include Related Resources as Compound Documents
* Sparse Fieldset Design

---

---

## Eager Loading and Serialization Responsibility

---

### Decision Context

Deciding whether controller or resource layer handles parsing the `include` parameter and triggering eager loading.

---

### Decision Criteria

* code organization
* performance
* maintainability

---

### Decision Tree

Does the controller parse the `include` parameter and call `->with()` before pagination?
├── YES → Correct — controller owns query optimization
│   ├── Are the includes validated against the allowlist before query execution?
│   │   ├── YES → Early rejection — no wasted database resources
│   │   └── NO → Add validation before the query
│   └── Does the resource use `whenLoaded()` for included relationships?
│       ├── YES → Resource safely handles both loaded and unloaded states
│       └── NO → Add `whenLoaded()` to prevent N+1 during serialization
└── NO → Does the resource layer lazy-load based on the include parameter?
    ├── YES → Refactor: move loading to controller, resource handles display only
    └── NO → Missing include handling — includes never result in eager loading

---

### Rationale

The controller owns query optimization. If the resource layer triggers lazy loads based on the include parameter, eager loading cannot be optimized, and N+1 queries are guaranteed. The controller validates, loads, and paginates; the resource serializes what was loaded.

---

### Recommended Default

**Default:** Controller parses includes, validates against allowlist, calls `->with()`, then paginates; resource uses `whenLoaded()`
**Reason:** Separation of concerns enables query optimization and lazy-load prevention.

---

### Risks Of Wrong Choice

Resource-layer lazy loading causes N+1 query explosion. Controller with unvalidated includes allows DoS or data leakage.

---

### Related Rules

* Map Includes to Eager Loads in Controllers Only
* Validate Includes Before Processing the Query

---

### Related Skills

* Conditional Relationship Inclusion
* Resource Controller Dependency Injection

---

---

## Deduplication Strategy

---

### Decision Context

Ensuring each unique resource appears only once in the `included` array, even when referenced from multiple relationships.

---

### Decision Criteria

* design
* performance

---

### Decision Tree

Can the same resource be referenced from multiple relationships in a single response?
├── YES → Implement a `type:id` deduplication registry
│   ├── Are there circular references in the relationship graph?
│   │   ├── YES → Implement depth tracking AND `type:id` dedup for comprehensive coverage
│   │   └── NO → `type:id` dedup is sufficient
│   └── Is memory a concern for large compound documents?
│       ├── YES → Track only `type:id` strings (minimal memory)
│       └── NO → Track full resource objects for immediate serialization
└── NO → No deduplication needed — each resource appears once naturally
    └── Are there nested includes that could introduce duplicates?
        ├── YES → Implement dedup defensively
        └── NO → Dedup not required but still recommended for robustness

---

### Rationale

JSON:API requires each included resource to appear at most once. Without deduplication, the same resource referenced from multiple relationships appears multiple times, wasting bandwidth and breaking client-side normalization stores (Redux, Ember Data).

---

### Recommended Default

**Default:** Always deduplicate by `type:id` string key; one pass per compound document
**Reason:** Deduplication prevents client store conflicts and reduces payload size; minimal performance cost.

---

### Risks Of Wrong Choice

Duplicate resources in `included` cause client-side normalization conflicts. Payload size increases with each redundant occurrence.

---

### Related Rules

* Always Deduplicate Included Resources by `type:id`
* Always Include `data` (Resource Linkage) in Relationship Objects

---

### Related Skills

* JSON:API Resource Structure
* Include Related Resources
