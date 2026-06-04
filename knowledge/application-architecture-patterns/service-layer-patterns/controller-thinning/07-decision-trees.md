# Decision Trees: Controller Thinning

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Controller thinning: what to extract and what to keep
- **Knowledge Unit ID:** SLP-03
- **Difficulty Level:** Foundation

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Extract to service/action vs keep in controller | Architecture | Controller review |
| 2 | Form Request vs inline validation | Architecture | Endpoint creation |
| 3 | API Resource vs inline response formatting | Architecture | Response design |

---

## Decision 1: Extract to service/action vs keep in controller

### Context
Controllers should only handle HTTP concerns: receive request, call service, return response. Any code that doesn't involve HTTP request/response handling belongs elsewhere. The Three-Line Controller pattern is the goal: (1) receive validated request, (2) call service/action, (3) return response.

### Decision Tree

```
Does the code involve HTTP request/response handling?
├── YES
│   Is it extracting data from the request?
│   ├── YES → Keep (but consider Form Request for validation)
│   └── NO → Formatting response? → Keep (but consider API Resource)
└── NO (business logic, querying, calculations, side effects)
    → EXTRACT to service or action
    Is this a single leaf-node operation?
    ├── YES → Extract to Action class
    └── NO → Multi-step orchestration → Extract to Service class
```

### Rationale
The controller's single responsibility is HTTP orchestration. Business logic, complex queries, and side-effect coordination don't belong in controllers. The Three-Line pattern makes controllers boring to read — any deviation signals logic that should be extracted.

### Recommended Default
Extract non-HTTP logic to services/actions; keep controllers at 3 lines per method

### Risks
- Over-extraction: creating a class for a 3-line conditional
- Under-extraction: 20-line controller with validation, business logic, query, and response
- Inconsistent pattern: some controllers thin, some fat — no team standard

### Related Rules
- Three-Line Controller Pattern (SLP-03/05-rules.md)
- Always Use Form Requests (SLP-03/05-rules.md)
- No Business Logic in Controllers (SLP-03/05-rules.md)

### Related Skills
- Thin Controllers by Extracting Business Logic (SLP-03/06-skills.md)
- Design Service Classes (SLP-01/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)

---

## Decision 2: Form Request vs inline validation

### Context
Always use Form Request classes for validation. Inline `$request->validate()` makes validation untestable and unreusable. Form Requests also handle authorization via the `authorize()` method, keeping both validation and auth checks out of the controller.

### Decision Tree

```
Does the endpoint need validation?
├── YES
│   Is the validation already defined in a Form Request class?
│   ├── YES → Use it (type-hint in controller method)
│   └── NO → Create a Form Request
│       Will this validation be reused by other endpoints?
│       ├── YES → Definitely create a Form Request (reusability)
│       └── NO → Still create a Form Request (testability, authorization)
└── NO → No validation needed (simple read-only endpoints)
```

### Rationale
Inline `$request->validate()` in controllers is un-testable (must hit the HTTP endpoint) and un-reusable (can't be used in another endpoint). Form Requests encapsulate validation rules, messages, and authorization in a single testable class. They keep controllers clean and allow validation to be tested independently.

### Recommended Default
Always use Form Requests for validation

### Risks
- Inline validation: untestable without HTTP request
- Inline validation: unreusable across endpoints
- Form Request without authorization check: missing auth for updates/deletes

### Related Rules
- Always Use Form Requests (SLP-03/05-rules.md)
- Three-Line Controller Pattern (SLP-03/05-rules.md)
- Authorization in Policies (SLP-03/05-rules.md)

### Related Skills
- Thin Controllers by Extracting Business Logic (SLP-03/06-skills.md)
- Build Form Request Validation (LAP-12/06-skills.md)

---

## Decision 3: API Resource vs inline response formatting

### Context
API Resources (JsonResource) centralize response transformation logic. Inline response formatting in controllers `return response()->json(['user' => $user, 'token' => ...])` duplicates transformation logic across endpoints and makes changes harder.

### Decision Tree

```
Is the response a single model/resource?
├── YES
│   Could a simple `return response()->json($model)` suffice?
│   ├── YES → Inline is acceptable (model serialization handles it)
│   └── NO (needs custom transformation, computed fields, relationships)
│       → Use API Resource
└── NO (collection, paginated, or complex response structure)
    → Use API Resource collection
    Is the transformation shared across multiple endpoints?
    ├── YES → Definitely create API Resource
    └── NO → Still create API Resource (consistency, future-proofing)
```

### Rationale
API Resources provide a dedicated layer for response transformation. They prevent response logic from leaking into controllers and ensure consistent output format across endpoints. The cost (one class per resource) is negligible compared to the benefit of centralized transformation logic.

### Recommended Default
API Resources for non-trivial response transformation

### Risks
- Inline transformation: duplicated across controllers, inconsistent format
- Inline transformation: changes require modifying every controller
- API Resource for everything: over-engineering simple responses

### Related Rules
- API Resources for Response Transformation (SLP-03/05-rules.md)
- Three-Line Controller Pattern (SLP-03/05-rules.md)
- No Business Logic in Controllers (SLP-03/05-rules.md)

### Related Skills
- Thin Controllers by Extracting Business Logic (SLP-03/06-skills.md)
- Implement DTOs and Transformers (LAP-14/06-skills.md)
