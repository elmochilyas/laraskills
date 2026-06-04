# Decision Trees: Form Request Validation

## Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 02-layered-architecture-patterns
**Knowledge Unit:** LAP-12-form-request-validation
**Generated:** 2026-06-04

---

## Decision Inventory

| # | Decision | Type | Lifecycle |
|---|----------|------|-----------|
| 1 | Form Request vs Inline Validation | Design | Design |
| 2 | Single Form Request vs Separate per Operation | Design | Design |
| 3 | Closure Rule vs Custom Rule Object | Design | Implement |
| 4 | Validation in Form Request vs Domain Object | Architectural | Design |
| 5 | authorize() in Form Request vs Policy vs Middleware | Architectural | Design |
| 6 | Input Preparation: prepareForValidation vs DTO | Design | Implement |

---

## Decision 1: Form Request vs Inline Validation

### Context
Whether to extract validation into a dedicated Form Request class or keep it inline in the controller.

### Decision Tree
Does the endpoint have 3+ validation rules?
- **YES** → Use Form Request
- **NO** → Continue

Will the validation logic be needed in another endpoint?
- **YES** → Use Form Request
- **NO** → Continue

Does the endpoint have authorization requirements?
- **YES** → Use Form Request (authorize() method)
- **NO** → Continue

Is this a prototype or throwaway code?
- **YES** → Inline validation acceptable
- **NO** → Use Form Request

### Recommended Default
Create a Form Request for every non-trivial endpoint. The cost of creating the file is 2 minutes.

### Risks
- Skipping Form Requests: validation scattered, authorization duplicated, testing harder
- Form Requests for every field: over-engineering for single-field skip endpoints

---

## Decision 2: Single Form Request vs Separate per Operation

### Context
Whether to use one Form Request for all operations on a resource or separate classes per HTTP method.

### Decision Tree
Does the resource have different validation rules for create vs update?
- **YES** → Separate Form Requests
- **NO** → Continue

Does the resource have different authorization for create vs delete?
- **YES** → Separate Form Requests
- **NO** → Continue

Are the HTTP methods doing fundamentally different operations?
- **YES** → Separate Form Requests
- **NO** → Single Form Request may suffice

### Recommended Default
Separate Form Requests per operation. Shared base class for common rules if needed.

### Risks
- Single Form Request with conditional rules: complex, hard to test, grows unbounded
- Too many Form Requests: more files, but each is small and focused

---

## Decision 3: Closure Rule vs Custom Rule Object

### Context
Whether to implement inline closure rules or extract to a dedicated Rule class.

### Decision Tree
Does the rule logic exceed 3 lines?
- **YES** → Custom Rule object
- **NO** → Continue

Will this rule be reused in other Form Requests?
- **YES** → Custom Rule object
- **NO** → Continue

Does the rule require dependency injection?
- **YES** → Custom Rule object (injectable)
- **NO** → Continue

Is the rule a simple format check (e.g., regex pattern)?
- **YES** → Closure acceptable
- **NO** → Custom Rule object

### Recommended Default
Custom Rule object for any non-trivial validation logic. Closures for trivial format checks.

### Risks
- Closures for complex logic: untestable, unreusable, untraceable
- Rule objects for everything: more files, but each is testable and named

---

## Decision 4: Validation in Form Request vs Domain Object

### Context
Whether a validation concern belongs in the Form Request (HTTP layer) or a domain object.

### Decision Tree
Does the validation check input format (email format, required fields, string length)?
- **YES** → Form Request
- **NO** → Continue

Does the validation check business rules (credit limit, subscription status, eligibility)?
- **YES** → Domain object
- **NO** → Continue

Does the validation check data existence or uniqueness?
- **YES** → Form Request (Rule::unique, exists)
- **NO** → Continue

Does the validation depend on authenticated user context?
- **YES** → Form Request (has access to user)
- **NO** → Form Request or Domain object

### Recommended Default
Format and existence validation in Form Request. Business rule validation in domain objects.

### Risks
- Business validation in Form Request: cannot be reused in CLI, queue, or API
- Format validation in domain: domain layer polluted with HTTP concerns

---

## Decision 5: authorize() in Form Request vs Policy vs Middleware

### Context
Where to place authorization logic for an endpoint.

### Decision Tree
Is the authorization check simple (user is admin, user owns resource)?
- **YES** → Form Request authorize() method
- **NO** → Continue

Does multiple endpoints share the same authorization logic?
- **YES** → Policy class
- **NO** → Continue

Is the authorization check a cross-cutting concern (logged in, verified email)?
- **YES** → Middleware
- **NO** → Form Request authorize() method

### Recommended Default
Simple checks in Form Request. Complex or shared checks in Policy. Cross-cutting in middleware.

### Risks
- Authorization in middleware: lose endpoint-specific granularity
- Authorization in Form Request only: cannot be reused outside HTTP
- No authorization at all: security vulnerability

---

## Decision 6: Input Preparation: prepareForValidation vs DTO

### Context
Whether to normalize input in the Form Request or create a DTO for transformation.

### Decision Tree
Is the transformation simple (trim, lowercase, cast)?
- **YES** → prepareForValidation
- **NO** → Continue

Does the transformation involve business logic or external lookups?
- **YES** → DTO with transformation
- **NO** → prepareForValidation

Will the transformed data be needed outside this endpoint?
- **YES** → DTO (reusable)
- **NO** → prepareForValidation

### Recommended Default
Simple normalization in prepareForValidation. Complex transformation in a DTO constructor.

### Risks
- Heavy logic in prepareForValidation: untestable transformation, hard to debug
- DTO for simple trimming: over-engineering for trivial transformations
