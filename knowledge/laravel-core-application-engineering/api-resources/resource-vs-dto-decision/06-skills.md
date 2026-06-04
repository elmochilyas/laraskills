# Skill: Decide Whether to Use a Resource, DTO, or Both for an Endpoint

## Purpose

Select the correct data transformation pattern — Resource-only, DTO-only, or both — for each endpoint based on endpoint complexity, client types, and service layer presence.

## When To Use

- Creating a new endpoint and deciding on the response architecture
- Refactoring an existing endpoint that mixes concerns (Resource passed to service, DTO used as response)
- Setting architectural standards for a new API project

## When NOT To Use

- For trivial endpoints (<50 lines, single file) — over-thinking the decision causes ceremony; pick one pattern and refactor later if needed
- When the pattern is already established project-wide — be consistent with the existing convention
- When prototyping or in MVP phase — use the simplest pattern that works

## Prerequisites

- Understanding of Resource purpose (HTTP response transformation)
- Understanding of DTO purpose (inter-layer data transport)
- The endpoint's specification: service layer presence, client types, conditional field needs

## Inputs

- Endpoint specification
- Decision matrix: Has service layer? Multiple clients? Conditional fields?
- Existing architecture patterns in the project

## Workflow

1. Evaluate the endpoint against the decision matrix:

| Has Service Layer? | Multiple Clients? | Conditional Fields? | Pattern |
|---|---|---|---|
| No | No | No | Resource only |
| No | Yes | Yes | Resource only |
| Yes | No | No | DTO only (or DTO + simple JSON) |
| Yes | Yes | No | DTO + Resource |
| Yes | Yes | Yes | DTO + Resource |
| Yes | No | Yes | DTO + Resource (or DTO with conditional `toArray`) |

2. For **Resource-only** (simple CRUD, no service layer):
   - Controller receives model directly or from repository
   - Resource wraps the model and returns from controller
   - No DTO layer needed

3. For **DTO-only** (internal API, no HTTP response features needed):
   - Service receives and returns DTOs
   - Controller returns DTO via `response()->json($dto->toArray())`
   - Only suitable for internal APIs where conditional responses and pagination metadata are not needed

4. For **both** (public API, complex logic):
   - Controller converts `FormRequest` to DTO
   - Service receives DTO, returns model or DTO
   - Resource wraps the result for HTTP response
   - Maintain clear dependency direction: DTOs never depend on Resources

5. Never pass Resources as arguments to services — services receive typed DTOs, models, or primitives.
6. Never return bare DTOs from controllers when Resource features would be useful (conditional fields, pagination metadata, JSON:API compliance).
7. Keep DTOs HTTP-agnostic — no `$request`, no `whenLoaded()`, no authorization checks.
8. Test the full DTO-to-Resource chain in integration tests to catch schema drift.

## Validation Checklist

- [ ] Services receive typed DTOs, not Resources or raw Request objects
- [ ] Controllers return Resources (or ResourceCollections), not bare DTOs
- [ ] DTOs do not depend on HTTP context or Resources
- [ ] The pattern choice (Resource-only, DTO-only, or both) is justified by endpoint complexity
- [ ] For simple CRUD without a service layer, DTOs are not forced
- [ ] For public APIs with complex logic, both DTOs and Resources are used
- [ ] The full chain (DTO → Resource → response) is tested in integration tests

## Common Failures

- Resource as DTO — passing a Resource to a service couples the service to HTTP context, making it untestable from CLI/queue
- DTO as response (missing features) — returning a DTO directly from a controller loses conditional field support, pagination metadata, and JSON:API compliance
- Over-thinking the decision — spending excessive time choosing between patterns for a trivial endpoint; pick one and refactor as the feature grows
- Circular dependency — a DTO that creates a Resource and a Resource that depends on the same DTO creates initialization deadlocks

## Decision Points

- **Resource-only vs both**: If the endpoint has a service layer and conditional response fields or multiple client types, use both. Otherwise, Resource-only is sufficient.
- **DTO vs Resource for internal APIs**: Use DTO-only for internal service-to-service communication where no HTTP response features are needed. Use Resources for any endpoint that produces HTTP output.
- **DTO creation location**: DTOs should be created from validated request data at the controller boundary — never from raw Request objects inside services.

## Performance Considerations

- Using both adds one extra object allocation (DTO) per request — ~0.002ms for single items, ~0.2ms for 100 items
- DTOs can be more memory-efficient than carrying Eloquent models through internal layers — DTOs are plain value objects without Eloquent overhead (change tracking, relationships, events)
- The DTO is freed after the response is built, while the Eloquent model persists through the full request lifecycle
- In most applications, the performance difference between patterns is negligible compared to database and network latency

## Security Considerations

- DTOs provide type safety — they guarantee that internal layers receive correctly typed data, preventing type confusion vulnerabilities
- Resources control what is exposed — they act as a whitelist for API output. DTOs should also be explicit about what they carry
- When both are used, there are two validation boundaries: FormRequest (input) and Resource (output). DTOs ensure type safety in between
- Schema drift between DTO and Resource can silently expose or hide fields — test the full chain to prevent this

## Related Rules

- Never Pass Resources as Arguments to Services (Architecture)
- Never Return Bare DTOs from Controllers When Resources Are Available (Architecture)
- Keep DTOs HTTP-Agnostic (Architecture)
- Use Both DTOs and Resources for Public APIs with Complex Logic (Architecture)
- Maintain Clear Dependency Direction — DTOs Never Depend on Resources (Architecture)
- Use the Decision Matrix for Each Endpoint's Pattern Choice (Architecture)
- Test the Full DTO-to-Resource Chain (Testing)
- Avoid Circular Dependencies Between DTOs and Resources (Architecture)

## Related Skills

- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Resource Collections](../resource-collections/06-skills.md)

## Success Criteria

- Every endpoint uses the correct pattern based on its complexity and client needs
- No Resources are passed to services
- No DTOs are returned from controllers when Resource features would be useful
- DTOs are HTTP-agnostic and never depend on Resources
- The full DTO-to-Resource chain is tested in integration tests
