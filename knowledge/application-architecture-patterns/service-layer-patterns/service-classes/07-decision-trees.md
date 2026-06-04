# Decision Trees: Service Classes

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Service Layer Pattern
- **Knowledge Unit:** Service classes: grouping operations by entity
- **Knowledge Unit ID:** SLP-01
- **Difficulty Level:** Foundation

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Service class vs inline logic in controller | Architecture | Controller creation |
| 2 | Entity-based vs domain-based service grouping | Architecture | Service creation |
| 3 | Service returning data vs HTTP response | Architecture | Method design |

---

## Decision 1: Service class vs inline logic in controller

### Context
Service classes are the default location for business logic in Laravel. If unsure where to put logic, put it in a service class. Controllers should only receive requests, call services, and return responses. Extracting to a service makes logic testable, reusable from CLI/queue, and keeps controllers thin.

### Decision Tree

```
Is the controller method more than 3 lines (request, call, response)?
├── YES → Extract business logic to service class
│   Does the logic involve coordination of multiple models/events/jobs?
│   ├── YES → Service class is correct (orchestration role)
│   └── NO → Action class may be sufficient (single operation)
└── NO (controller is already a thin proxy)
    → May not need extraction, but evaluate:
    Will this logic be reused from CLI/queue contexts?
    ├── YES → Extract to service anyway (reusability)
    └── NO → Inline is acceptable for simple CRUD proxy
```

### Rationale
Service classes provide a consistent, predictable location for business logic. The primary signal is controller method length — if it exceeds 3-5 lines, extraction is warranted. Even for thin controllers, extract if the logic will be reused outside HTTP context (CLI commands, queue jobs, API consumers).

### Recommended Default
Extract business logic to service classes by default

### Risks
- No service class: logic scattered across controllers, untestable
- God service class: 40 methods covering unrelated domains
- Anemic service: just wraps model methods without adding value

### Related Rules
- Prefer Service Classes (SLP-01/05-rules.md)
- One Responsibility Per Method (SLP-01/05-rules.md)
- Return Data, Not HTTP Responses (SLP-01/05-rules.md)
- Limit Dependencies to Five (SLP-01/05-rules.md)

### Related Skills
- Design Service Classes Grouping Operations by Entity (SLP-01/06-skills.md)
- Thin Controllers (SLP-03/06-skills.md)

---

## Decision 2: Entity-based vs domain-based service grouping

### Context
Services can be grouped by entity (UserService, OrderService) or by domain (BillingService, NotificationService). Entity-based grouping is the default — each entity gets a service. Domain-based grouping is for operations that span multiple entities within a business domain.

### Decision Tree

```
Do the operations center on a single entity?
├── YES (User registration, password change, suspension)
│   → Entity-based service: UserService
│   Each method operates primarily on one entity type
└── NO (operations span multiple entities in a business process)
    → Domain-based service: BillingService
    Does the domain map to a module boundary?
    ├── YES → Domain-based service in module
    └── NO → Entity-based services + orchestrator
```

### Rationale
Entity-based grouping is simpler and more intuitive — developers know where to find user-related logic. Domain-based grouping is appropriate when operations naturally span multiple entities (e.g., Billing involves Invoices, Payments, Subscriptions). Default to entity-based and only use domain-based when entity boundaries are too narrow.

### Recommended Default
Entity-based service (UserService, OrderService); domain-based for multi-entity operations

### Risks
- Entity-based for multi-entity operations: services need to inject other services
- Domain-based for single-entity operations: blurs where to find specific logic
- No clear grouping rule: developers create inconsistent naming

### Related Rules
- Prefer Service Classes (SLP-01/05-rules.md)
- One Responsibility Per Method (SLP-01/05-rules.md)
- Avoid God Service Classes (SLP-01/05-rules.md)

### Related Skills
- Design Service Classes Grouping Operations by Entity (SLP-01/06-skills.md)
- Design Action Classes (SLP-02/06-skills.md)

---

## Decision 3: Service returning data vs HTTP response

### Context
Services must return data (models, collections, DTOs, primitives), not HTTP responses. A service returning `response()->json(...)` couples business logic to HTTP, preventing reuse from CLI commands, queue jobs, or other non-HTTP contexts.

### Decision Tree

```
Does the method return data or an HTTP response?
├── Returns HTTP response (response()->json, response()->view)
│   → REFACTOR: Return data instead
│   Is the method called from a controller currently?
│   ├── YES → Move response formation to controller; service returns data
│   └── NO → Method probably shouldn't exist this way — restructure
└── Returns data (model, collection, DTO, primitive)
    → Correct — controller handles response formatting
    Could response transformation be extracted to API Resource?
    ├── YES → Consider API Resource for response formatting
    └── NO → Inline response is acceptable
```

### Rationale
Services are reusable across HTTP, CLI, queue, and test contexts. A service that returns HTTP responses can only be used from HTTP contexts. Returning data keeps the service pure and reusable. The controller's only job is to transform that data into an HTTP response.

### Recommended Default
Services return data; controllers return responses

### Risks
- Service returning HTTP response: unreusable from CLI/queue
- Service returning HTTP response: untestable without HTTP context
- No API Resource: response formatting logic duplicated across controllers

### Related Rules
- Return Data, Not HTTP Responses (SLP-01/05-rules.md)
- Limit Dependencies to Five (SLP-01/05-rules.md)
- Wrap Multi-Write Operations in Transactions (SLP-01/05-rules.md)

### Related Skills
- Design Service Classes Grouping Operations by Entity (SLP-01/06-skills.md)
- Thin Controllers (SLP-03/06-skills.md)
- Build Service-Action-Repository Pyramid (SLP-04/06-skills.md)
