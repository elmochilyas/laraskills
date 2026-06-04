# Skill: Implement Service vs Action Decision

## Purpose
Choose between action class (single operation) and service class (multiple related operations) based on complexity: single responsibility action vs multi-method service per domain.

## When To Use
- Architecture design decisions
- Layer separation planning
- Team convention establishment

## When NOT To Use
- Simple CRUD with no business logic

## Prerequisites
- Action class pattern
- Service class pattern

## Decision Matrix

| Factor | Action Class | Service Class |
|--------|-------------|---------------|
| Single operation | ✓ | Overkill |
| Multiple related ops | ✗ | ✓ |
| Shared dependencies | ✗ (resolved per-action) | ✓ (shared in constructor) |
| Test scope | Single method | Multiple methods |
| Reusability | Across entry points | Across domain |
| Complexity | Low-medium | Medium-high |

## Workflow
1. Use action class for: single operation, one public method, simple logic
2. Use service class for: multiple related operations, shared dependencies, complex workflows
3. Use action class for HTTP-triggered operations
4. Use service class for background/queued operations
5. Never mix action and service patterns in same class
6. Document decision in team architecture guide
7. Re-evaluate if action grows beyond single responsibility

## Validation Checklist
- [ ] Action used for single operations
- [ ] Service used for multi-method domains
- [ ] Pattern consistent across project
- [ ] Decision documented

## Related Skills
- Action Class Design
- Service Class Design
- Service Orchestration
