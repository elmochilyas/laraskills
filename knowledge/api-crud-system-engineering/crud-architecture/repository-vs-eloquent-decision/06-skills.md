# Skill: Implement Repository vs Eloquent Decision

## Purpose
Decide between Repository pattern (abstraction over data access) and direct Eloquent usage based on application complexity, testing needs, and team familiarity.

## When To Use
- Architecture decision for data access layer
- Multi-data-source applications
- Complex domain logic requiring data abstraction

## When NOT To Use
- Simple CRUD applications
- Eloquent-first development teams
- Small teams focused on rapid development

## Decision Points
| Factor | Repository | Direct Eloquent |
|--------|-----------|-----------------|
| Data source switching | ✓ Required | ✗ Difficult |
| Testability | ✓ Easy to mock | ~ (Laravel fakes) |
| Complexity | Higher | Lower |
| Team learning curve | Medium | Low |
| Flexibility | Lower (abstracted) | Higher (full Eloquent) |

## Workflow
1. Use direct Eloquent for: simple CRUD, single data source, rapid development
2. Use Repository for: multiple data sources, caching layer abstraction, complex query logic
3. Never mix Repository and direct Eloquent for same model
4. Define Repository interface for contract enforcement
5. Implement EloquentRepository as default implementation
6. Use Repository for queries, not for write operations (actions handle writes)
7. Test Repository implementation against database
8. Document decision per model

## Validation Checklist
- [ ] Data source requirements evaluated
- [ ] Team familiarity considered
- [ ] Repository or Eloquent chosen per model
- [ ] Interface defined if Repository used
- [ ] Consistent approach within project
- [ ] Decision documented

## Related Skills
- Service Class Design
- Action Class Design
- Layer Isolation Rules
