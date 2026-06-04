# Service Layer (Fowler) — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** Enterprise Patterns
- **Knowledge Unit:** Service Layer
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Dependency Injection and Controller patterns
- [ ] Know the difference between Application Service and Domain Service
- [ ] Familiar with Transaction Script and Domain Model patterns

## Implementation Checklist
- [ ] Service classes encapsulate business logic separate from controllers
- [ ] Service methods are use-case focused (single responsibility)
- [ ] Services accept DTOs/primitive params, not HTTP Request objects
- [ ] Services return DTOs/domain objects, not HTTP Response objects
- [ ] Transaction management handled at service layer boundary
- [ ] Services are framework-agnostic (no facades, no Request/Response)
- [ ] Service has clear boundary — reusable from HTTP, CLI, queue

## Verification Checklist
- [ ] No fat service with 20+ methods (god object, SRP violation)
- [ ] Service doesn't know about HTTP (request, session, auth facade)
- [ ] Service doesn't return HTTP response objects
- [ ] Service contains real logic (not just passthrough to repository)
- [ ] Service has single concern (not mixing reporting, CRUD, email)
- [ ] Service is testable without HTTP context

## Security Checklist
- [ ] Authorization gates applied in service layer
- [ ] Input validation at service boundaries
- [ ] Service doesn't bypass security middleware
- [ ] Audit logging at service entry points

## Performance Checklist
- [ ] Service method call overhead is negligible
- [ ] Transaction scope managed — affects locking duration
- [ ] Service as facade over domain has no additional cost

## Production Readiness Checklist
- [ ] Service layer consistently applied across the application
- [ ] Services organized by domain, not by technical concern
- [ ] Service methods documented with inputs and outputs
- [ ] Services covered by unit tests

## Common Mistakes to Avoid
- [ ] Fat service with 20+ methods (god object, SRP violation)
- [ ] Service that knows about HTTP (request, session, auth facade)
- [ ] Service returning HTTP response objects (cannot reuse for CLI/queue)
- [ ] Anemic service (just calls repository with no logic — unnecessary layer)
- [ ] Service with mixed concerns (reporting + CRUD + email in same class)
