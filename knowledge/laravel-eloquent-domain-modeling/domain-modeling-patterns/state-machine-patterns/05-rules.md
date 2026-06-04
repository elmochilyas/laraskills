# State Machine Patterns — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | state-machine-patterns |

## Rules

### Rule 1: Define all states as constants or backed enum
All possible states an entity can be in must be explicitly enumerated as class constants or a backed enum. This provides a single source of truth for valid states.

### Rule 2: Define allowed transitions in a central map
Map each source state to its valid target states in a single, readable array. This makes the entire state machine visible at a glance.

### Rule 3: Guard transitions with domain exceptions
The `transitionTo()` method must check the transition map and throw a `\DomainException` for invalid transitions. Never silently ignore invalid transitions.

### Rule 4: Add shorthand methods for common transitions
Add expressive shorthand methods (`confirm()`, `ship()`, `cancel()`) for the most frequently used transitions to improve readability and enable transition-specific logic.

### Rule 5: Test allowed and invalid transitions
Write tests for every allowed transition (assert the state changes correctly) and every invalid transition (assert the exception is thrown).
