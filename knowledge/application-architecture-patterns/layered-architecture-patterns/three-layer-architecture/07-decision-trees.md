# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Three-layer architecture: Presentation, Business, Data
**Generated:** 2026-06-03

---

# Decision Inventory

* Three-layer architecture vs Clean/Hexagonal architecture
* Business logic in Service classes vs Eloquent model methods
* Use Form Requests vs inline $request->validate()

---

# Architecture-Level Decision Trees

---

## Three-Layer Architecture vs Clean/Hexagonal Architecture

---

## Decision Context

Three-layer architecture (Controller → Service → Model) is the natural evolution of MVC in Laravel. Clean/Hexagonal adds Domain, Application, Infrastructure, and Presentation layers with strict dependency rules. The choice depends on complexity, team size, and framework independence requirements.

---

## Decision Criteria

* performance considerations — three-layer is lighter; Clean adds indirection cost
* architectural considerations — three-layer is framework-coupled; Clean provides framework independence
* security considerations — no difference; both handle auth at Presentation layer
* maintainability considerations — three-layer is simpler to implement; Clean requires more discipline

---

## Decision Tree

Architecture complexity?
↓
Simple CRUD with minimal business logic?
YES → Default MVC — three layers not needed
NO → Business logic complex enough to warrant framework independence?
    YES → Clean/Hexagonal Architecture — full layer separation
    NO → Team size > 10 with multiple delivery mechanisms?
        YES → Clean/Hexagonal — need framework independence
        NO → Three-layer (Controller → Service → Model)
            Three-layer is sufficient

---

## Rationale

Three-layer architecture provides clear separation without the overhead of Clean Architecture's port-adapter pattern. It's the recommended default for most Laravel applications. Clean Architecture is justified only when business logic complexity, framework independence, or multiple delivery mechanisms demand it.

---

## Recommended Default

**Default:** Three-layer architecture (Controller → Service → Model)
**Reason:** Three layers handle most needs. Additional layers increase complexity and should be justified by demonstrated need. Start with three, add more only when specific pain emerges.

---

## Risks Of Wrong Choice

Clean Architecture for simple CRUD adds 2-4x file count and 1.5-3x development time without benefit. Three-layer for complex domains leads to fat services and untestable business logic.

---

## Related Rules

- Rule: Three Layers Before More (LAP-01/05-rules.md)
- Rule: Controller Delegates to Service (LAP-01/05-rules.md)

---

## Related Skills

- Implement Three-Layer Architecture (LAP-01/06-skills.md)
- Apply Clean Architecture Layers (LAP-02/06-skills.md)

---

## Business Logic in Service Classes vs Eloquent Model Methods

---

## Decision Context

Business logic can live in Service classes (orchestration pattern) or in Eloquent model methods (rich domain model). The choice affects testability, reusability, and adherence to the Single Responsibility Principle.

---

## Decision Criteria

* performance considerations — no significant difference
* architectural considerations — Service classes are testable without HTTP; model methods are coupled to Eloquent
* security considerations — no security impact
* maintainability considerations — Service classes prevent fat models; model methods keep related logic together

---

## Decision Tree

Where to place business logic?
↓
Logic involves multiple entities or external dependencies?
YES → Service class — orchestration across models
NO → Logic is a calculation, validation, or transformation on a single entity?
    YES → Model method or Value Object
    NO → Does the logic need to be reused across different contexts (HTTP, CLI, queue)?
        YES → Service class — independent delivery mechanism
        NO → Model method — simplest location

---

## Rationale

Business logic that spans multiple entities or requires external dependencies (repositories, APIs) belongs in Service classes. Logic that is intrinsic to a single entity (status transitions, calculations) belongs on the model. The distinction prevents both fat services and fat models.

---

## Recommended Default

**Default:** Service classes for multi-entity orchestration; model methods for single-entity logic
**Reason:** Service classes provide testability and reusability. Model methods keep simple logic close to the data. The boundary should be clear: if logic needs dependencies from outside the model, extract to a service.

---

## Risks Of Wrong Choice

All logic in services creates anemic domain models (see SLP-18). All logic in models creates fat Eloquent models with too many responsibilities.

---

## Related Rules

- Rule: Controller Delegates to Service (LAP-01/05-rules.md)
- Rule: Services Add Business Value (LAP-01/05-rules.md)

---

## Related Skills

- Implement Three-Layer Architecture (LAP-01/06-skills.md)
- Design a Service Class (SLP-01/06-skills.md)

---

## Use Form Requests vs Inline $request->validate()

---

## Decision Context

Laravel provides Form Request classes for encapsulating validation logic. The alternative is inline `$request->validate()` in controller methods. The choice affects testability, reusability, and controller thinness.

---

## Decision Criteria

* performance considerations — Form Request resolution adds negligible overhead
* architectural considerations — Form Requests encapsulate validation and authorization
* security considerations — Form Requests provide centralized authorization via `authorize()` method
* maintainability considerations — Form Requests are testable; inline validation scatters rules

---

## Decision Tree

Validation complexity?
↓
Endpoint has 3+ validation rules?
YES → Use Form Request class
NO → Validation rule is reusable across multiple endpoints?
    YES → Use Form Request class
NO → Endpoint needs authorization logic (can the user do this)?
    YES → Use Form Request with `authorize()` method
NO → Inline `$request->validate()` is acceptable for single simple rules

---

## Rationale

Form Requests provide self-contained, testable validation classes with built-in authorization. Inline validation scatters rules across controllers, cannot be reused, and is untestable in isolation. The threshold for Form Request usage is low (3+ rules or any authorization need).

---

## Recommended Default

**Default:** Use Form Request classes for all endpoints with 3+ validation rules
**Reason:** Form Requests keep controllers thin, centralize validation logic, and enable testing of validation rules in isolation. Inline validation is acceptable only for trivial single-rule cases.

---

## Risks Of Wrong Choice

Form Request proliferation for every single-field endpoint adds unnecessary files. Inline validation at scale creates untestable, scattered validation logic.

---

## Related Rules

- Rule: Form Request Encapsulates Validation (LAP-01/05-rules.md)
- Rule: Controller Delegates to Service (LAP-01/05-rules.md)

---

## Related Skills

- Implement Three-Layer Architecture (LAP-01/06-skills.md)
- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)
