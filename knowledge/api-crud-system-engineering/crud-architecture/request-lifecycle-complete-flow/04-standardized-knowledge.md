# ECC Standardized Knowledge — Request Lifecycle Complete Flow

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Request Lifecycle Complete Flow |
| Difficulty | Foundation |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

The request lifecycle complete flow traces an HTTP request from entry point through every architectural layer to the response. It connects all CRUD architecture patterns — routing, middleware, controllers, DTOs, actions/services, repositories, and response serialization — into a single end-to-end narrative. Understanding the complete flow is essential for debugging effectively, adding new features consistently, and reasoning about where each concern is handled.

## Core Concepts

- **The Complete Flow (12 steps)**: HTTP Request → Entry Point → Bootstrap → Router → Middleware → Controller Resolution → Controller Method → DTO Construction → Action/Service Execution → Repository/Model → Response Construction → Terminable Middleware
- **Layer Responsibility**: Each layer has a distinct concern — middleware handles auth/throttle, controller handles HTTP, DTO handles type-safe data transport, action/service handles business logic, repository handles data access.
- **The Non-Negotiable Path**: Data must always flow through Controller → DTO → Action/Service → Data Access. Skipping any step requires explicit justification.
- **Container Resolution Chain**: Each layer is resolved by the service container when type-hinted as a dependency, creating a recursive resolution tree.

## When To Use

- Onboarding new developers to understand how the architecture fits together
- Debugging unexpected request behavior — trace through each layer to identify the root cause
- Designing new endpoints — use the flow to determine where each concern belongs
- Architecture documentation — the flow is the map of the application

## When NOT To Use

- The flow is descriptive, not prescriptive — it documents the layers that exist, not which layers you must create
- Simple operations may skip layers (see When to Skip Layers) — the flow shows the complete path, not the minimum path

## Best Practices

- Trace the full flow for every new endpoint to ensure correct layer placement
- Add monitoring at layer boundaries: controller entry/exit times, action execution times, repository query times
- When debugging, check layers in order: middleware (rejection?) → controller (data received?) → DTO (constructed correctly?) → action (executed correctly?) → data access (right result?)
- Document the flow for new team members as part of onboarding

## Architecture Guidelines

- Authentication and input validation happen before the controller (middleware and FormRequest)
- Data transformation (DTO) is the boundary between HTTP and business logic
- Business rules live in actions/services, never in controllers or models
- Response formatting (resources/JSON) is an HTTP concern — it belongs in or near the controller
- Post-response cleanup (terminable middleware) runs after the response is sent

## Performance Considerations

- The complete flow adds ~1-5ms overhead from framework bootstrap, middleware, routing, and container resolution
- For typical CRUD operations, this is 5-20% of total request time — the rest is database queries
- Optimization should focus on database queries, not the flow overhead
- Under Laravel Octane, the bootstrap cost is paid once and shared across all requests

## Security Considerations

- Middleware is the first line of defense — authentication, throttle, and CORS checks happen before any business logic
- FormRequest validation prevents malformed data from reaching DTOs and actions
- DTOs should only receive validated data — raw request input must never pass through
- Terminable middleware can perform security logging after the response is sent

## Common Mistakes

- **Assuming the Flow is Shorter Than It Is**: Ignoring middleware, DTOs, and response formatting. Solution: Trace the full flow for every new endpoint.
- **Skipping Steps in the Flow**: Controller calls `Model::create()` directly with `$request->all()`. Solution: Follow the complete flow — every step exists for a reason.
- **Not Understanding Where to Add New Logic**: Adding business rules in the controller. Solution: Identify the correct layer based on the concern type.
- **Flow Short-Circuit Debugging**: Middleware returns a response before the controller, but developer debugs "why is my controller not being called?" Solution: Check middleware response codes early in debugging.

## Anti-Patterns

- **Architecture by Shortcut**: Consistently skipping layers (controller → model directly). The architecture collapses and the flow no longer represents reality.
- **Data Without DTO**: Passing raw validated arrays through all layers. Loses type safety and self-documenting contracts at every layer boundary.
- **Business Logic in Controllers**: Placing business rules in the controller because "that's where the code was." Violates the flow's layer responsibility map.

## Examples

### Complete CRUD Create Flow
```
POST /api/users
  → public/index.php
    → bootstrap/app.php
      → Kernel::handle($request)
        → Router matches users.store
          → Middleware: auth:api, throttle:60,1
            → UserController@store resolved with CreateUserAction
              → CreateUserRequest validated
                → CreateUserDto::fromRequest($request)
                  → CreateUserAction::execute($dto)
                    → DB::transaction → User::create()
                      → Response: 201 JSON
                        → Terminable middleware runs
```

### Layer Responsibility Map
```
Step 1-3:   Kernel/Bootstrap     → Application initialization
Step 4:     Router                → URI → route match
Step 5:     Middleware            → Auth, throttle, session, CSRF
Step 6-7:   Controller            → HTTP concerns
Step 8:     DTO                   → Type-safe data carrier
Step 9:     Action/Service        → Business logic
Step 10:    Repository/Model      → Data access
Step 11:    Response               → HTTP response building
Step 12:    Terminable Middleware  → Post-response cleanup
```

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| All CRUD Architecture KUs | Each KU covers a step in the flow | Prerequisite |
| Thin Controller Principle | Step 6-7 | Related |
| Data Transfer Object Design | Step 8 | Related |
| Action Class Design | Step 9 | Related |
| Service Class Design | Step 9 | Related |
| Repository Pattern Design | Step 10 | Related |
| Response Serialization Patterns | Step 11 | Follow-up |
| Middleware Design | Step 5 | Follow-up |
| Octane Lifecycle | The flow under Laravel Octane | Follow-up |

## AI Agent Notes

- This KU is the capstone that synthesizes all CRUD architecture patterns into a single narrative
- It does not introduce new patterns — it shows how existing patterns fit together in sequence
- Use this flow as the mental model when designing new features: which layer handles each concern?
- The flow is consistent across Laravel 8-13 (Laravel 11+ has simplified bootstrap but the layer flow is unchanged)
- When generating code for a new endpoint, follow the flow: FormRequest → DTO → Action → Controller wiring → Response

## Verification

- [ ] Each layer in the flow has a single, clear responsibility
- [ ] Data flows through layers in the correct order
- [ ] No layer skips an intermediate layer without explicit justification
- [ ] Authentication and validation happen before business logic
- [ ] DTOs form the boundary between HTTP and business logic
- [ ] Business logic is in actions/services, not controllers
- [ ] Response formatting is in or near the controller
- [ ] The flow is documented and understood by the team
