# State Machine Patterns — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | state-machine-patterns |

## Validation Checklist

- [ ] All states are enumerated (constants or backed enum)
- [ ] Allowed transitions are defined in a central map
- [ ] `transitionTo()` enforces the map and throws on invalid
- [ ] Shorthand methods exist for common transitions
- [ ] Domain events are dispatched on transition
- [ ] Every allowed transition has a test
- [ ] Every invalid transition is tested (throws)
- [ ] Terminal states have empty transition arrays
