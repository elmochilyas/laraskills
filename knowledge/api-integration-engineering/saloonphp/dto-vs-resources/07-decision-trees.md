# Metadata

**Domain:** API Integration Engineering
**Subdomain:** 02-saloonphp
**Knowledge Unit:** dto-vs-resources
**Generated:** 2026-06-03

---

# Decision Inventory

1. Data Transformation Pattern Selection
2. DTO Implementation Strategy
3. Namespace and Code Organization Strategy

---

# Architecture-Level Decision Trees

---

## Data Transformation Pattern Selection

---

## Decision Context

Choosing between DTO, API Resource, or combined pattern for data transformation.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Is this data coming FROM an external API (inbound)?
↓
YES → Is the data consumed by non-Laravel consumers or passed across boundaries?
  ↓
  YES → Use DTO (immutable, typed, framework-agnostic)
  NO → Use DTO; never use JsonResource for inbound data
NO → Is this data going TO an API response (outbound)?
  ↓
  YES → Does the response need field transformation, hiding, or versioning?
    ↓
    YES → Use API Resource (JsonResource) for presentation control
    NO → Use Resource for consistent collection output even without transformation
  NO → Is this internal processing between layers?
    ↓
    YES → Use DTO for type-safe internal data contracts
    NO → Neither; raw data or Eloquent models may suffice for simple cases
  ↓
  Need both inbound type safety and outbound presentation control?
  ↓
  YES → Combined pattern: DTO for inbound, Resource wrapping DTO for outbound
  NO → Single pattern sufficient for the data flow direction

---

## Rationale

DTOs enforce type safety and immutability for inbound data that crosses system boundaries. Resources separate presentation from persistence for outbound responses. Combined pattern gives both but adds complexity for simple cases.

---

## Recommended Default

**Default:** DTO for inbound API data; Resource for outbound API responses
**Reason:** Clear data flow direction discipline enforces separation of concerns

---

## Risks Of Wrong Choice

Using Resources for inbound data couples consumption to the request cycle. Using DTOs for outbound responses misses Laravel Resource features (conditional attributes, relationships).

---

## Related Rules

Use Resources for Outgoing, DTOs for Incoming

---

## Related Skills

Choose Between DTO and Resource Patterns in SaloonPHP Responses

---

## DTO Implementation Strategy

---

## Decision Context

Choosing the technical approach for DTO implementation in Laravel.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

Is PHP 8.1+ available in the project?
↓
YES → Use native readonly classes (best performance, no dependencies)
  ↓
  Need automatic casting (nested objects, date conversion)?
  ↓
  YES → Use Spatie Laravel Data package (auto-casting, validation)
  NO → Manual fromResponse() factory is sufficient for simple DTOs
NO → Use Spatie Laravel Data package (readonly not available, needs workaround)
  ↓
  Are DTOs auto-generated from OpenAPI specs?
  ↓
  YES → Use Spatie Data for generated code (consistent, spec-driven)
  NO → Manual DTOs with readonly classes are simpler
  ↓
  Need validation rules embedded in DTOs?
  ↓
  YES → Spatie Data provides built-in validation rules per property
  NO → Native DTOs with fromResponse() factory and manual validation

---

## Rationale

Native PHP 8.1 readonly classes are the simplest DTO with zero dependency overhead. Spatie Laravel Data adds auto-casting, nested DTO mapping, and validation at the cost of a dependency.

---

## Recommended Default

**Default:** Native readonly classes with fromResponse() factory for simple DTOs; Spatie Data for complex nested DTOs
**Reason:** Match complexity to need — zero deps for simple, full framework for complex

---

## Risks Of Wrong Choice

Spatie Data for single-field DTOs adds unnecessary dependency complexity. Native DTOs without fromResponse() factory scatter mapping logic across the codebase.

---

## Related Rules

Use readonly Properties for DTOs, Centralize DTO Construction in Factory Methods

---

## Related Skills

Choose Between DTO and Resource Patterns in SaloonPHP Responses

---

## Namespace and Code Organization Strategy

---

## Decision Context

Structuring DTO and Resource files for discoverability and maintainability.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Is the Laravel application integrating with multiple external services?
↓
YES → Namespace DTOs per service: App\Data\{ServiceName}\{Entity}
  ↓
  Are DTOs shared across different API versions?
  ↓
  YES → Version namespace: App\Data\V1\{Service}\{Entity}
  NO → Single version namespace; no need for versioning
NO → Group DTOs by domain: App\Data\{Domain}\{Entity}
  ↓
  Is the integration large (>20 DTOs per service)?
  ↓
  YES → Sub-namespace by resource type (e.g., App\Data\Stripe\Charges\Charge)
  NO → Flat namespace per service is discoverable enough
  ↓
  Need to generate TypeScript types from DTOs?
  ↓
  YES → Use Spatie Data with TypeScript transformer for type generation
  NO → PHP-only DTOs; no cross-language type sharing needed

---

## Rationale

Per-service namespace groups DTOs by integration boundary, making it clear which service a DTO belongs to. Versioned namespace enables parallel API version support without class name conflicts.

---

## Recommended Default

**Default:** App\Data\{ServiceName}\{EntityName} for DTOs; App\Http\Resources\{Version}\ for Resources
**Reason:** Convention-over-configuration discoverability; consistent across projects

---

## Risks Of Wrong Choice

Flat DTO namespace with hundreds of classes becomes unmaintainable. Overly nested namespaces make DTOs hard to find and import. No versioning namespace causes breaking changes on spec updates.

---

## Related Rules

Always Use DTOs for Incoming API Data

---

## Related Skills

Choose Between DTO and Resource Patterns in SaloonPHP Responses
