# Transaction Script Refactoring — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | transaction-script-refactoring |

## Rules

### Rule 1: Extract business logic from controllers to domain methods
Every business rule, state change, and calculation in a controller must be extracted to a domain method on the relevant model. Controllers should not contain business logic.

### Rule 2: Controllers sequence, models execute
A controller's job is to read input, call domain methods in sequence, and return a response. The model's job is to execute business rules and manage its own state.

### Rule 3: Move side effects to domain events
Side effects (sending emails, logging, API calls, cache invalidation) should be extracted to domain event listeners, not kept inline in the controller or domain method.

### Rule 4: Test domain methods, not inline controller logic
Write model tests that exercise the extracted domain methods directly. Controller tests should verify orchestration, not re-test the business logic.

### Rule 5: No duplicate logic between controller and model
After extraction, the controller must not contain any residual business logic or state-change code that duplicates the domain method.
