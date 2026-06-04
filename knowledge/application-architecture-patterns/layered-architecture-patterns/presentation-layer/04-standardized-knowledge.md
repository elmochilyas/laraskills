# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Presentation layer: controllers, requests, resources, routes
Knowledge Unit ID: LAP-08
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

The Presentation layer is the outermost layer, handling communication between the application and external actors. It consists of Controllers (request handlers), Form Requests (validation and authorization), API Resources (response transformation), and Route files. In layered architecture, the Presentation layer is explicitly thin — it validates input, delegates to Application layer, and formats output. It contains zero business logic.

---

# Core Concepts

- **Controllers**: Receive HTTP request, delegate to Application layer, return response. Testable via dependency injection.
- **Form Requests**: Encapsulate validation rules and authorization. Self-contained, testable, reusable.
- **API Resources**: Transform models/entities into JSON. Define response shape. Can be nested for relationships.
- **Routes**: Define URL structure, middleware, and controller binding. Grouped by concern (web, api, console).

---

# When To Use

- Always — Presentation layer exists in every Laravel application
- Form Requests for any endpoint with 3+ validation rules
- API Resources for any JSON response that differs from default model serialization
- Single-action controllers when each endpoint has distinct dependencies

---

# When NOT To Use

- For prototypes where speed trumps structure — `$request->validate()` inline is acceptable temporarily
- Form Requests for single-field validation — the overhead outweighs the benefit
- API Resources for responses with 2-3 fields returning directly from controller

---

# Best Practices

- **Never put business logic in controllers.** WHY: Controllers are HTTP adapters. Business logic belongs in Services/Actions/Use Cases. If a controller contains `if` statements about business rules, extract them.
- **Use Form Requests for validation, not `$request->validate()` in controller body.** WHY: Form Requests make validation logic testable, reusable, and keep controllers thin.
- **Inject dependencies in controllers** rather than resolving from container or using facades. WHY: Enables controller testing without bootstrapping full Laravel application.
- **Use invokable controllers** when each endpoint has distinct dependencies. WHY: Prevents over-injection in multi-method controllers — each action gets only what it needs.
- **Use API Resources to control response shape.** WHY: Exposes only intended fields; prevents leaking internal model attributes.

---

# Architecture Guidelines

- Request lifecycle: Route → Middleware → Form Request → Controller → Use Case → Response.
- Controllers delegate to Application layer — never call Eloquent directly.
- Form Requests handle authorization via `authorize()` method.
- Single-action controllers are preferred for complex operations; resource controllers for CRUD.
- The Presentation layer can depend on Application and Domain, but not Infrastructure.

---

# Performance Considerations

- Form Requests resolved by service container — negligible overhead.
- API Resource transformation can be significant for large collections — use `ResourceCollection::paginate()`.
- Route caching (`php artisan route:cache`) improves performance for Presentation layer routing.

---

# Security Considerations

- Authentication is applied via middleware at the route level (Presentation layer).
- Authorization in Form Requests (`authorize()` method) keeps permission logic in the Presentation boundary.
- API Resources prevent over-exposure by controlling which fields are serialized.

---

# Common Mistakes

1. **Business logic in controllers:** Controllers that validate business rules, calculate values, or make database queries. Cause: convenience. Consequence: untestable, fat controllers. Better: delegate to use cases/services.

2. **Validation in controller body:** Using `$request->validate()` instead of Form Requests. Cause: laziness or not knowing Form Requests exist. Consequence: hard-to-test validation. Better: create dedicated Form Request classes.

3. **Models passed directly to views/resources:** Passing Eloquent models that may expose sensitive fields. Cause: convenience. Consequence: potential data leaks. Better: use Resources to control serialization.

4. **Controller bloat:** Single controller with 10+ injected dependencies. Cause: multiple actions sharing one class. Consequence: constructor pollution. Better: split into invokable controllers per operation.

---

# Anti-Patterns

- **Fat Controller**: Business logic, data access, and response formatting in one method.
- **Inline validation**: `$request->validate()` in controller body instead of Form Request.
- **Model exposure**: Passing Eloquent models directly to views/resources without transformation.

---

# Examples

```php
class StoreInvoiceController {
    public function __invoke(
        StoreInvoiceRequest $request,
        CreateInvoiceUseCase $useCase
    ): InvoiceResource {
        $dto = CreateInvoiceDto::fromRequest($request);
        $result = $useCase->execute($dto);
        return new InvoiceResource($result);
    }
}
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-01 Three-layer architecture | LAP-06 Application layer | SLP-03 Controller thinning |
| LAP-02 Clean Architecture | CPC-01 Interface contracts | CPC-08 CQRS pattern |

---

# AI Agent Notes

- Keep generated controllers thin — validate via Form Request, delegate to use case, return response.
- Always generate Form Request classes for any endpoint with validation rules.
- Use invokable controllers for single-action endpoints.

---

# Verification

- [ ] Controllers contain zero business logic
- [ ] All validation uses Form Request classes (no `$request->validate()` in controller bodies)
- [ ] API Resources control response serialization
- [ ] Controllers inject dependencies, not resolve from container
- [ ] Authorization checks use Form Request `authorize()` or Policies
