# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Controller thinning: what to extract and what to keep
Knowledge Unit ID: SLP-03
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Overview

Controller thinning extracts business logic from controllers into dedicated classes (services, actions, use cases), leaving controllers responsible only for HTTP concerns: receiving requests, calling services, and returning responses. The rule: if code doesn't involve HTTP request/response handling, it doesn't belong in a controller. Controllers should be thin enough that they're boring to read.

---

# Core Concepts

- **Stays in controller**: Calling service/action, passing validated data, returning response.
- **Gets extracted**: Business logic → Service/Action. Validation → Form Request. Authorization → Policy. Response transformation → API Resource. Query logic → Repository/Query Object.

---

# When To Use

- Always. Every non-trivial controller should follow the thinning pattern.

---

# When NOT To Use

- Prototype-stage application.
- Controller is already a simple proxy to model method with no additional logic.

---

# Best Practices

- **Aim for the Three-Line Controller pattern.** WHY: Receive validated request, call service, return response. If the controller is longer, extract the logic.
- **Always use Form Requests for validation.** WHY: `$request->validate()` in the controller body makes validation logic untestable and unreusable.
- **Services return data, controllers return responses.** WHY: A service returning `response()->json(...)` couples business logic to HTTP and prevents reuse from CLI or queue contexts.
- **Establish a max lines per controller standard.** WHY: Common: 50 lines per controller, 10 lines per method. Enforce via code review.

---

# Architecture Guidelines

- Thin controller + Form Request + Service: most common pattern.
- Thin controller + Action: for single operations.
- If a controller method has logic beyond 3-5 lines, extract to service/action.

---

# Performance Considerations

- No significant performance impact. Extra method calls are negligible.

---

# Security Considerations

- Authorization belongs in policies or Form Request's `authorize()` method, not in controllers.

---

# Common Mistakes

1. **Over-extraction:** Extracting every conditional to a separate class. Cause: zeal for clean code. Consequence: indirection without benefit. Better: 3-4 lines doesn't need extraction.

2. **Validation in controller body:** Using `$request->validate()` instead of Form Request. Cause: quick coding. Consequence: untestable, unreusable validation. Better: always use Form Requests.

3. **Inconsistent thinning:** Some controllers thin, others fat. Cause: no team standard. Consequence: confusion about which pattern to follow. Better: establish and enforce a standard.

---

# Anti-Patterns

- **Service returning response objects**: A service method returning `response()->json(...)`. Business logic coupled to HTTP.
- **Controller with business logic**: Validation + business rules + querying + response formatting all in one method.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| SLP-01 Service classes | SLP-02 Action classes | SLP-10 Service vs Action decision |
| COS-02 Layer-based organization | SLP-05 DTO pattern | SLP-17 Service layer testing |

---

# AI Agent Notes

- Default controller structure: 3 lines (request, service call, response).
- Generate Form Requests with validation and authorization.
- Services should never return HTTP responses.

---

# Verification

- [ ] No business logic in controllers
- [ ] Form Requests handle validation
- [ ] Policies handle authorization
- [ ] API Resources handle response formatting
- [ ] Controller methods are ≤ 10 lines
