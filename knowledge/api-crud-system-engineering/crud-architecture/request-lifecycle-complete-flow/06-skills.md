# Skill: Trace the Complete Request Lifecycle

## Purpose
Trace an HTTP request through all 12 layers from entry point to response — routing, middleware, controllers, DTOs, actions/services, repositories, and response serialization — understanding where each concern is handled.

## When To Use
- Onboarding new developers to understand architecture
- Debugging unexpected request behavior — trace through each layer
- Designing new endpoints — determine where each concern belongs
- Architecture documentation

## When NOT To Use
- The flow is descriptive, not prescriptive — documents existing layers
- Simple operations may skip layers — this shows the complete path

## Prerequisites
- Understanding of all CRUD architecture layers
- Laravel request lifecycle

## Inputs
- Endpoint specification
- Layer responsibility map

## Workflow
1. Trace the 12-step flow for every new endpoint during design: Bootstrap → Router → Middleware → Controller → DTO → Action/Service → Data Access → Response
2. Respect flow order — each step occupies a fixed position; never reorder or skip without justification
3. Never pass raw validated arrays through all layers — construct DTO as typed boundary
4. Business logic belongs in actions/services, never controllers
5. Add monitoring at layer boundaries — timing instrumentation at controller entry, action/service entry, repository query execution
6. Authentication and input validation happen before controller (middleware and FormRequest)
7. Response formatting is an HTTP concern — belongs in or near controller
8. Post-response cleanup (terminable middleware) runs after response sent

## Validation Checklist
- [ ] Each layer has single, clear responsibility
- [ ] Data flows through layers in correct order
- [ ] No layer skips intermediate layer without explicit justification
- [ ] Authentication and validation before business logic
- [ ] DTOs form boundary between HTTP and business logic
- [ ] Business logic in actions/services, not controllers
- [ ] Response formatting in or near controller

## Common Failures
- Assuming the flow is shorter than it is — ignoring middleware, DTOs, response formatting
- Skipping steps in the flow — controller calling `Model::create()` directly
- Not understanding where to add new logic — business rules in controller
- Flow short-circuit debugging — middleware returns response but developer debugs controller

## Decision Points
- Full flow vs simplified — full for complex endpoints, simplified for trivial reads
- Monitoring granularity — every layer for critical endpoints, key layers for standard
- DTO vs no DTO — DTO for >2 data fields, typed params for simple scalars

## Performance Considerations
- Complete flow adds ~1-5ms overhead from bootstrap, middleware, routing, container resolution
- For typical CRUD, this is 5-20% of total request time — database queries dominate
- Under Octane, bootstrap cost paid once and shared across requests

## Security Considerations
- Middleware is first line of defense — auth, throttle, CORS before any business logic
- FormRequest prevents malformed data reaching DTOs and actions
- DTOs should only receive validated data — raw request input never passes through

## Related Rules
- Respect the 12-Step Flow Order
- Trace the Full Flow for Every New Endpoint
- Never Pass Raw Validated Arrays Through All Layers
- Add Monitoring at Layer Boundaries
- Business Logic Belongs in Actions/Services, Never Controllers

## Related Skills
- All CRUD Architecture KUs — each covers a step in the flow
- Thin Controller Principle — step 6-7
- Data Transfer Object Design — step 8
- Repository Pattern Design — step 10

## Success Criteria
- New endpoints are designed with correct layer placement
- Debugging follows layer order to identify root cause
- Monitoring at key boundaries pinpoints slow layers
- Team understands and documents the complete flow
- No business logic leaks into controllers