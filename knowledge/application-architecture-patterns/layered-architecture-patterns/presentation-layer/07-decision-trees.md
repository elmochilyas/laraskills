# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** Presentation layer: controllers, requests, resources, routes
**Generated:** 2026-06-03

---

# Decision Inventory

* Single-action invokable controllers vs resource controllers
* Form Request validation vs inline $request->validate()
* API Resources vs direct model serialization

---

# Architecture-Level Decision Trees

---

## Single-Action Invokable Controllers vs Resource Controllers

---

## Decision Context

Controllers can be single-action invokable classes (one `__invoke` per class) or resource controllers with multiple methods (index, create, store, show, edit, update, destroy). The choice affects dependency injection, testability, and file count.

---

## Decision Criteria

* performance considerations — no performance difference
* architectural considerations — invokable controllers have explicit dependencies; resource controllers share dependencies
* security considerations — invokable controllers enable per-operation authorization
* maintainability considerations — invokable controllers prevent constructor bloat; resource controllers reduce file count

---

## Decision Tree

Controller structure?
↓
Each endpoint has distinct dependencies?
YES → Single-action invokable controllers — inject per-action dependencies
NO → Standard CRUD operations with shared dependencies?
    YES → Resource controller — group related CRUD operations
    NO → Complex operation with 5+ injected dependencies?
        YES → Single-action invokable — keeps constructor clean
        NO → Resource controller — simpler for standard CRUD

---

## Rationale

Single-action invokable controllers prevent constructor pollution from unrelated dependencies. A resource controller for `InvoicesController` might have `store()` needing `CreateInvoice`, `index()` needing `ListInvoices`, and `show()` needing nothing — the constructor must inject all three. Invokable controllers inject only what the single action needs.

---

## Recommended Default

**Default:** Single-action invokable controllers for complex operations; resource controllers for standard CRUD
**Reason:** Invokable controllers keep dependency injection clean and explicit. Resource controllers are simpler for standard CRUD operations where all actions share similar dependencies.

---

## Risks Of Wrong Choice

Resource controllers with many diverse actions create constructor bloat. Invokable controllers for simple CRUD create unnecessary file proliferation.

---

## Related Rules

- Rule: Never Put Business Logic in Controllers (LAP-08/05-rules.md)
- Rule: Inject Dependencies in Controllers (LAP-08/05-rules.md)

---

## Related Skills

- Apply Presentation Layer Controllers (LAP-08/06-skills.md)
- Implement Controller Thinning (SLP-03/06-skills.md)

---

## Form Request Validation vs Inline $request->validate()

---

## Decision Context

Laravel provides Form Request classes for encapsulating validation. The alternative is inline `$request->validate()`. The choice affects testability, reusability, and controller thinness.

---

## Decision Criteria

* performance considerations — Form Request resolution adds negligible overhead
* architectural considerations — Form Requests separate validation from controllers
* security considerations — Form Requests provide centralized authorization via `authorize()`
* maintainability considerations — Form Requests are independently testable; inline is not

---

## Decision Tree

Validation approach?
↓
Endpoint has 3+ validation rules?
YES → Form Request class
NO → Validation logic is reused across multiple endpoints?
    YES → Form Request class
NO → Endpoint needs authorization logic?
    YES → Form Request with `authorize()` method
NO → Single, simple validation rule?
    YES → Inline `$request->validate()` is acceptable

---

## Rationale

Form Requests provide self-contained, testable validation with built-in authorization. Inline validation scatters rules, cannot be reused, and is untestable in isolation.

---

## Recommended Default

**Default:** Form Request classes for all endpoints with 3+ validation rules
**Reason:** Form Requests keep controllers thin, centralize validation, enable testing, and provide authorization. Inline validation is acceptable only for trivial single-rule cases.

---

## Risks Of Wrong Choice

Form Request for every single-field endpoint creates unnecessary files. Inline validation at scale creates scattered, untestable validation logic.

---

## Related Rules

- Rule: Form Request Encapsulates Validation (LAP-01/05-rules.md)
- Rule: Never Put Business Logic in Controllers (LAP-08/05-rules.md)

---

## Related Skills

- Apply Presentation Layer Controllers (LAP-08/06-skills.md)
- Implement Three-Layer Architecture (LAP-01/06-skills.md)

---

## API Resources vs Direct Model Serialization

---

## Decision Context

API Resources control how Eloquent models are serialized to JSON. Direct serialization (returning models from controllers) exposes all model attributes. Resources enable field selection, transformation, and relationship inclusion.

---

## Decision Criteria

* performance considerations — API Resource transformation adds overhead for large collections
* architectural considerations — Resources define response contracts; direct serialization is ad-hoc
* security considerations — Resources prevent over-exposure of sensitive model attributes
* maintainability considerations — Resources centralize response logic; direct serialization scatters it

---

## Decision Tree

Response serialization?
↓
Response needs to expose only specific fields (not all model attributes)?
YES → API Resource — control response shape
NO → Response needs transformation or computed fields?
    YES → API Resource — compute and transform
    NO → Response includes related models?
        YES → API Resource with relationships
        NO → Direct model serialization — `return $invoice` is sufficient for simple responses

---

## Rationale

API Resources provide explicit control over response shape, preventing over-exposure of model attributes and enabling computed fields. Direct serialization is acceptable for simple responses where the model naturally represents the desired output.

---

## Recommended Default

**Default:** Use API Resources for all API responses
**Reason:** API Resources prevent accidental over-exposure of model attributes, enable response transformation, and define explicit response contracts. The overhead is minimal compared to the security and maintainability benefits.

---

## Risks Of Wrong Choice

Direct model serialization risks leaking sensitive fields (`password`, `secret`). API Resources for every trivial response can create unnecessary files for simple `return $user` cases.

---

## Related Rules

- Rule: Never Pass Request Object to Service (LAP-01/05-rules.md)
- Rule: API Resources Control Response Serialization (LAP-08/05-rules.md)

---

## Related Skills

- Apply Presentation Layer Controllers (LAP-08/06-skills.md)
- Apply DTO Pattern for Type Safety (SLP-05/06-skills.md)
