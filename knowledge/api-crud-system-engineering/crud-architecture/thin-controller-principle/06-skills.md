# Skill: Apply Thin Controller Principle

## Purpose
Keep controllers focused on HTTP concerns only — parse request, delegate to lower layer, return response — with no business logic, Eloquent queries, event dispatching, or side effects.

## When To Use
- Always — universally applicable to any Laravel application
- For API controllers that return JSON responses
- For web controllers that return views
- As foundational principle for all CRUD architecture patterns

## When NOT To Use
- The principle does not apply to route closures (though same separation should apply)
- Simple prototyping where speed is prioritized (introduce before production)
- No production scenario where fat controllers are preferable

## Prerequisites
- Understanding of layer separation
- Dependency injection

## Inputs
- Controller endpoint specification
- Service/action class targets

## Workflow
1. Enforce controller method body to max 10 lines of executable code
2. Never write Eloquent queries in controllers — delegate to services/actions
3. Never dispatch events, email, or queue jobs from controllers — actions/services handle side effects
4. Always use FormRequests for input validation — never `$request->validate()` inline
5. Never return Eloquent models directly — use API resources or DTOs
6. Controller tests focus on HTTP concerns only — status codes, headers, response structure
7. Test business logic against actions/services directly — not through HTTP

## Validation Checklist
- [ ] Controller has no Eloquent queries (no `::find`, `::where`, `DB::`)
- [ ] Controller has no business conditionals
- [ ] Controller has no email, event, or queue dispatching
- [ ] Controller uses FormRequests for input validation
- [ ] Controller delegates to actions or services
- [ ] Controller does not return Eloquent models directly
- [ ] Controller method body <10 lines executable code

## Common Failures
- Fat controller creep — adding "just one query" normalizes fat controllers
- Putting validation in controller methods — use FormRequests
- Returning Eloquent models directly — exposes all attributes
- Business logic hidden in controllers — extract to actions/services

## Decision Points
- Controller vs route closure — controller for structured, closure for trivial
- FormRequest vs inline validation — FormRequest for anything beyond 1-2 fields
- Resource vs DTO for response — resource for HTTP, DTO for internal

## Performance Considerations
- Thin controllers add zero performance overhead — delegation ~0.001ms
- File count increase from more classes irrelevant with OpCache
- No performance justification for fat controllers

## Security Considerations
- Thin controllers prevent accidental exposure of sensitive model attributes
- FormRequests provide centralized validation preventing malformed data
- Controllers bypassing services/actions bypass authorization and business rules

## Related Rules
- Controller Body Must Not Exceed 10 Lines of Executable Code
- Never Write Eloquent Queries in Controllers
- Never Dispatch Events, Email, or Queue Jobs from Controllers
- Always Use FormRequests for Input Validation
- Never Return Eloquent Models Directly from Controllers
- Controller Tests Focus on HTTP Concerns Only

## Related Skills
- Controller-DTO-Action Flow — standard thin controller delegation
- Controller-DTO-Service Flow — thin controller with service delegation
- Request Lifecycle Complete Flow — end-to-end flow
- When to Skip Layers — intentional deviation from thin controller

## Success Criteria
- All controllers are thin — 3-5 lines per method
- No Eloquent queries in any controller
- Business logic testable without HTTP
- Controller tests assert HTTP concerns only
- FormRequests used for all input validation