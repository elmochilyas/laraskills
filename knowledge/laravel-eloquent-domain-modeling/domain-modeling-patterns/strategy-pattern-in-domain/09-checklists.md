# Strategy Pattern in Domain — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | strategy-pattern-in-domain |

## Validation Checklist

- [ ] Strategy interface has a single responsibility
- [ ] Each concrete strategy implements the full algorithm
- [ ] Strategy selection is decoupled from strategy execution
- [ ] New strategies can be added without modifying existing strategies
- [ ] Strategies are injectable (no inline instantiation)
- [ ] Each strategy is unit-testable independently
- [ ] Strategies are side-effect-free (pure computation)
- [ ] Strategy interface has clear typed parameters and return type
