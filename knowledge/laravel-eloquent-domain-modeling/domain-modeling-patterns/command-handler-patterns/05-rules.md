# Command Handler Patterns — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | command-handler-patterns |

## Rules

### Rule 1: Keep command DTOs as data carriers only
Command DTOs must have readonly properties and no behavior. They carry input data from the application layer to the domain layer — nothing more.

### Rule 2: Handlers orchestrate, models decide
A handler sequences calls to domain methods on models and services. It must never contain business logic, validation rules, or state change logic inline.

### Rule 3: Return typed results from handlers
Handlers should return a typed result (entity, result DTO, or void) rather than mixed or array. This makes the handler's contract explicit.

### Rule 4: Inject domain abstractions, not Eloquent
Handlers should depend on domain interfaces (repositories, services), not directly on Eloquent models or query builders.

### Rule 5: Wire in service providers, not controllers
Register command handlers in service providers with their dependencies. Controllers should only call handlers, not wire them.
