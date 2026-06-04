# Skill: Implement Layer Isolation Rules

## Purpose
Enforce layer isolation: controllers only handle HTTP concerns, actions/services handle business logic, repositories/queries handle data access — no layer skipping or cross-layer dependencies.

## When To Use
- Multi-layer architecture enforcement
- Code review standards
- Team architecture conventions

## When NOT To Use
- Simple single-layer applications
- Prototype development

## Workflow
1. Controller: HTTP concerns only (validate, authorize, return response)
2. Action/Service: Business logic only (no HTTP awareness)
3. Repository: Data access only (no business logic)
4. Model: Eloquent concerns only (relationships, scopes, accessors)
5. View/Presentation: API Resources (response transformation only)
6. No layer imports from non-adjacent layers (Controller → Repository directly)
7. Controller → Action → Repository (not Controller → Repository)
8. Controller → Service → Action (orchestration)
9. Enforce via architecture tests
10. Document layer rules and allowed dependencies

## Validation Checklist
- [ ] Controller only does HTTP concerns
- [ ] Action/Service has no HTTP awareness
- [ ] Repository/query handles data access only
- [ ] No direct Controller → Repository calls
- [ ] Architecture tests enforce rules
- [ ] Layer dependencies documented

## Related Skills
- Directory Organization Strategies
- Thin Controller Principle
- Service Class Design
