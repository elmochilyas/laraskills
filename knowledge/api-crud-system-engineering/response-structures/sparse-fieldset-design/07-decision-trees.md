# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** Response Structures
**Knowledge Unit:** Sparse Fieldset Design
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Fieldset Mode: Strict vs Lenient

---

### Decision Context

Choosing whether to reject invalid field names (strict) or silently ignore them (lenient) when clients request fields via `fields[resourceType]=field1,field2`.

---

### Decision Criteria

* security
* maintainability
* reliability

---

### Decision Tree

Are the API consumers primarily third-party or unknown clients?
├── YES → Use strict mode (return 400 for unknown fields)
│   ├── Does the client need immediate feedback about typos?
│   │   ├── YES → Strict mode provides clear error messages
│   │   └── NO → Still prefer strict — field names are part of the API contract
│   └── Does strict mode cause excessive support requests for field name changes?
│       ├── YES → Document field names clearly; maintain backward compatibility
│       └── NO → Strict mode is the safer default
└── NO → Are clients internal and trusted?
    ├── YES → Lenient mode is acceptable (silently ignore unknown fields)
    └── NO → Use strict mode — unknown clients need clear API contract enforcement

Is there a whitelist of allowed fields per resource type?
├── YES → Good — validation uses the whitelist
└── NO → Define a whitelist — never accept arbitrary field names

---

### Rationale

Strict mode enforces the API contract and gives clients immediate feedback about typos or removed fields. Lenient mode silently ignores mistakes, masking bugs. For public APIs, strict mode is safer because field names are part of the documented contract.

---

### Recommended Default

**Default:** Strict mode (400 for unknown fields) for public APIs; lenient mode for internal APIs only
**Reason:** Strict mode provides clear feedback; lenient mode masks client bugs that silently degrade UX.

---

### Risks Of Wrong Choice

Lenient mode masks client typos — client requests `emial` instead of `email`, gets empty response, no error. Strict mode on internal APIs adds friction for trusted developers.

---

### Related Rules

* Always Validate Requested Fields Against a Whitelist
* Use a Reusable Trait for Sparse Fieldset Logic

---

### Related Skills

* Implement Sparse Fieldsets
* JSON:API Resource Structure

---

---

## Database Optimization Integration

---

### Decision Context

Deciding whether to combine sparse fieldsets with `Model::select()` to reduce database column loading, or apply field filtering only at the serialization layer.

---

### Decision Criteria

* performance
* architectural

---

### Decision Tree

Does the resource use computed/accessor attributes (`$appends`, `getXAttribute`)?
├── YES → Can `Model::select()` include all columns needed by accessors?
│   ├── YES → Use `Model::select()` with the accessor-required columns plus requested fields
│   └── NO → Apply sparse fieldsets at serialization only (accessors need full model)
└── NO → Can the requested fields be mapped directly to database columns?
    ├── YES → Combine with `Model::select()` for full optimization
    │   ├── `$columns = array_intersect($requestedFields, $dbColumns);`
    │   └── `User::select($columns)->get();`
    └── NO → Apply at serialization layer only (fields are computed, not DB columns)

Is the response cached?
├── YES → Include fieldset parameters in the cache key
└── NO → No cache key consideration

---

### Rationale

Sparse fieldsets applied only at the serialization layer still load all model attributes from the database. The majority of query cost (data transfer, hydration) is unaffected. `Model::select()` ensures the database also returns only needed columns, but cannot be used when computed attributes require the full model.

---

### Recommended Default

**Default:** Combine sparse fieldsets with `Model::select()` when fields map directly to DB columns; serialize-only when accessors/computed fields are involved
**Reason:** True optimization requires both query and serialization filtering; accessor dependencies may prevent query-level optimization.

---

### Risks Of Wrong Choice

No `Model::select()` means all DB columns are still loaded — minimal performance gain. Using `Model::select()` without including accessor dependencies causes missing attribute errors.

---

### Related Rules

* Combine with `Model::select()` for Database Optimization
* Apply Fieldsets to Included Resources Recursively

---

### Related Skills

* Conditional Field Inclusion
* Response Compression

---

---

## Default Fieldset Definition

---

### Decision Context

Defining the default set of fields returned when the client does not specify a fieldset parameter.

---

### Decision Criteria

* maintainability
* architectural

---

### Decision Tree

Should every client always receive a consistent default fieldset?
├── YES → Define a single default per resource type
│   ├── Are there different client types (mobile vs admin) with different typical needs?
│   │   ├── YES → Consider role-based defaults or separate endpoints
│   │   └── NO → Single default for all clients
│   └── Does the default include all available fields?
│       ├── YES → Maximum payload by default; clients opt-in to reduction
│       └── NO → Minimal payload by default; clients opt-in to additional fields
└── NO → Use client-specific defaults based on user role or endpoint
    ├── Role-based: admin gets all fields, regular user gets subset
    └── Endpoint-based: list endpoint returns minimal fields, detail endpoint returns full

Are sensitive fields excluded from the whitelist entirely?
├── YES → Good — blacklist approach is unsafe; whitelist is the only safe approach
└── NO → Remove sensitive fields from the whitelist

---

### Rationale

The default fieldset defines the baseline payload size. Returning all available fields by default means every client pays the cost, even if they only need 3 fields. A minimal-default approach encourages clients to request specific fields, optimizing bandwidth from day one.

---

### Recommended Default

**Default:** Return all available fields by default (max payload); clients opt into reduction via fieldset parameter
**Reason:** Simpler for clients that need all fields; bandwidth-conscious clients use the fieldset parameter to reduce payload.

---

### Risks Of Wrong Choice

Max-default wastes bandwidth for clients that need only a few fields. Min-default forces every client to specify fields on every request. Sensitive fields in the whitelist expose data to any client that knows the field name.

---

### Related Rules

* Cache Parsed Fieldsets Per Request
* Always Validate Requested Fields Against a Whitelist

---

### Related Skills

* Conditional Field Inclusion
* Response Format Decision Framework
