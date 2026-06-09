---
description: Create a detailed implementation plan for Laravel features
---

# Plan Command

## Usage

Analyze the feature request and produce a structured implementation plan before writing code.

### Steps

1. Clarify requirements and acceptance criteria
2. Identify affected components (models, controllers, actions, routes, tests)
3. Design data structures and database schema
4. Plan controller → action → service → contract → infrastructure flow
5. List test scenarios (happy path, validation, edge cases)
6. Identify risks and dependencies

## Architecture Flow

```
Controller (thin — validation, auth, response)
    ↓
Action (orchestration, single responsibility)
    ↓
Domain Service (business logic)
    ↓
Contract (interface)
    ↓
Infrastructure (Stripe, Eloquent, Mailgun, etc.)
    ↓
Database / External API
```

## Deliverables

- Implementation steps with file paths
- Database migration design
- Route definitions
- Pest test plan (RED → GREEN → REFACTOR)
- Security considerations

## References

- See skill: `laravel-patterns` for architecture patterns
- See skill: `laravel-tdd` for testing approach
- See skill: `laravel-security` for security requirements
- See rules/laravel/architecture.md for architecture flow rules
