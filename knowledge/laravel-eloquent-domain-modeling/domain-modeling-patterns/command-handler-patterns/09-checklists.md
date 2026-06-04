# Command Handler Patterns — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | command-handler-patterns |

## Validation Checklist

- [ ] Command DTO has readonly properties and no behavior
- [ ] Handler depends on domain abstractions (interfaces), not concretions
- [ ] Handler calls domain methods on models (doesn't inline logic)
- [ ] Handler returns a typed result or void
- [ ] Handler is wired for dependency injection
- [ ] No HTTP concerns in the command or handler
- [ ] Command handler is testable with mocked dependencies
- [ ] Handler is registered in a service provider
