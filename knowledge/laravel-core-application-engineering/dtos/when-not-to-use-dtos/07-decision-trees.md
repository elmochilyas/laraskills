# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** When NOT to Use DTOs
**Generated:** 2026-06-03

---

# Decision Inventory

* DTO vs No DTO (2-3 Layer Threshold)
* Start With vs Without DTO
* DTO vs API Resource for Output

---

# Architecture-Level Decision Trees

---

## Decision 1: DTO vs No DTO (2-3 Layer Threshold)

---

## Decision Context

Whether to introduce a typed DTO for a data flow or use a validated array/FormRequest directly.

---

## Decision Criteria

* Number of application layers the data crosses
* Number of entry points that produce the same data shape
* Whether the data is a simple pass-through or has transformation
* Whether the output is for HTTP response (use API Resource instead)

---

## Decision Tree

How many application layers does this data cross?
↓
1-2 layers (controller → service only)?
YES → Does the same data shape come from 2+ entry points (HTTP + CLI + queue)?
    YES → DTO recommended — ensures consistent contract across all entry points
    NO → Does the service receive raw `$request->all()` without validation?
        YES → Fix validation first — then decide if DTO is needed
        NO → Use validated array — DTO adds ceremony without value for simple flows
NO → 2-3+ layers (controller → service → action → repository)?
    YES → DTO recommended — type safety across multiple boundaries pays off
NO → Is the output for HTTP responses?
    YES → Use API Resources, not DTOs — built-in conditional attributes and pagination
NO → Is the data used in a public package or library API?
    YES → DTO always justified — typed API contract for external consumers
NO → Does the data have 3+ fields with type transformations?
    YES → DTO adds value — self-documenting signature with typed parameters
    NO → Use validated array

---

## Rationale

Every DTO adds ceremony: a class file, factory methods, serialization logic, and tests. This ceremony is justified when data crosses multiple layers or entry points that benefit from a shared typed contract. For a simple controller-to-service pass-through with a single entry point, the validated array provides sufficient type safety. The 2-3 layer threshold prevents premature abstraction.

---

## Recommended Default

**Default:** Validated array for 1-2 layer flows with a single entry point; DTO for 3+ layers, multi-entry-point data, or when type transformation is needed
**Reason:** The threshold ensures DTOs are introduced only when they provide measurable value, keeping the codebase lean and avoiding unnecessary ceremony.

---

## Risks Of Wrong Choice

* DTO for simple flow: File and test proliferation for no benefit
* No DTO for multi-layer flow: Hidden contract, runtime errors on key typos in downstream services
* DTO for HTTP output: Missing built-in features that API Resources provide

---

## Related Rules

* Apply the 2-3 Layer Threshold Before Introducing a DTO (05-rules.md)
* Skip DTOs That Mirror FormRequest Keys Exactly with No Transformation (05-rules.md)
* Use API Resources, Not DTOs, for HTTP Response Shaping (05-rules.md)

---

## Related Skills

* Skill: Decide Whether to Introduce a DTO for a Data Flow

---

## Decision 2: Start With vs Without DTO

---

## Decision Context

Whether to create a DTO upfront when building a new feature or start with validated arrays and introduce a DTO when the need emerges.

---

## Decision Criteria

* Stability of the data shape (rapidly changing vs stable)
* Whether the feature is a prototype/MVP or production
* Whether the data shape is defined by an external specification (stable)
* Whether the service has one caller or multiple expected callers

---

## Decision Tree

Is this a prototype, MVP, or rapid iteration phase?
↓
YES → Start without DTO — data shapes change frequently; DTO churn slows iteration
NO → Is the data shape defined by an external specification (OpenAPI, third-party API)?
    YES → DTO can be designed upfront — external contract is stable
    NO → Is the service expected to have multiple callers in the future?
        YES → Start without DTO, introduce when second caller appears
        NO → Start without DTO — single caller, simple flow
NO → Is this a public package or library API?
    YES → DTO designed upfront — the API contract is the product
    NO → Start without DTO and introduce when a second entry point appears or a field-related bug occurs
NO → Document the rationale if DTO is intentionally skipped for a complex operation

---

## Rationale

Letting DTOs emerge from service needs rather than entity structure produces DTOs that exactly match the data flow requirements. Premature DTOs are often unused or need restructuring when actual requirements are discovered. Starting without DTOs keeps the codebase flexible during rapid iteration while allowing DTOs to be introduced when their value is proven.

---

## Recommended Default

**Default:** Start without DTO for new features; introduce when a second entry point appears or a field-related bug occurs
**Reason:** This lean approach avoids premature abstraction while maintaining a clear migration path. DTOs are introduced when their value is demonstrated.

---

## Risks Of Wrong Choice

* DTO upfront for unstable shape: Constant restructuring as requirements evolve
* No DTO for stable public API: Consumers receive inconsistent contracts
* No documentation for skipped DTO: Future developers add DTOs that were intentionally avoided

---

## Related Rules

* Start Without DTOs and Introduce Them When a Second Entry Point Appears (05-rules.md)
* Make DTOs Opt-In, Not Default — Avoid Team Dogma (05-rules.md)
* Document the Rationale When Intentionally Skipping a DTO for a Complex Operation (05-rules.md)

---

## Related Skills

* Skill: Decide Whether to Introduce a DTO for a Data Flow

---

## Decision 3: DTO vs API Resource for Output

---

## Decision Context

Whether to use a DTO (with `toArray()`) or a Laravel API Resource (`JsonResource`) for shaping output data.

---

## Decision Criteria

* Whether the output is for HTTP API responses
* Whether conditional attributes, pagination, or relationship loading are needed
* Whether the output is for non-HTTP consumers (CLI, export, email)
* Whether the output shape varies by context (authorization, eager loading)

---

## Decision Tree

Is the output for an HTTP API response?
↓
YES → Use API Resource (`JsonResource`) — built-in conditional attributes, pagination, `whenLoaded()`, authorization
NO → Is the output for non-HTTP consumers (CLI output, CSV export, email content)?
    YES → Use DTO with `toArray()` — API Resources are HTTP-specific
NO → Does the output require conditional attributes based on context?
    YES → Use API Resource for HTTP; use Transformer class for non-HTTP
    NO → Does the output require pagination metadata?
        YES → Use API Resource (`paginated` / `collection` methods)
        NO → Use DTO with `toArray()` for internal output; API Resource for HTTP
NO → Does the output shape vary based on the requesting user's permissions?
    YES → API Resource — `when($request->user()->can('viewEmail', ...), $this->email)`
    NO → DTO with `toArray()` is sufficient for simple, unconditional output

---

## Rationale

API Resources are designed specifically for HTTP response shaping — they provide built-in conditional attributes, pagination support, relationship loading, and authorization-aware output. DTOs are for internal data flow and lack these features. Using DTOs for HTTP output means manually implementing conditional attributes and pagination, duplicating what API Resources provide.

---

## Recommended Default

**Default:** API Resources for HTTP API responses; DTOs for non-HTTP output (CLI, exports, email) and internal data flow
**Reason:** API Resources are purpose-built for HTTP response shaping with built-in conditionals and pagination. DTOs handle internal data flow and non-HTTP output.

---

## Risks Of Wrong Choice

* DTO for HTTP output: Manually implementing conditionals and pagination that API Resources provide
* API Resource for non-HTTP: HTTP-specific abstractions in non-HTTP contexts (CLI, export)
* DTO for all output: Missing authorization-aware conditional attributes

---

## Related Rules

* Use API Resources, Not DTOs, for HTTP Response Shaping (05-rules.md)
* Avoid DTO Churn During Rapid Prototyping and MVP Phases (05-rules.md)

---

## Related Skills

* Skill: Decide Whether to Introduce a DTO for a Data Flow

