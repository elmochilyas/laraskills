# Factory Method Alternatives — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | factory-method-alternatives |

## Validation Checklist

- [ ] Factory method is static and returns `self`
- [ ] Method name describes the creation intent
- [ ] Method does not persist the model (just creates)
- [ ] No external service access in the factory method
- [ ] Callers use the factory method instead of `new Model()`
- [ ] All creation paths are covered by factory methods
- [ ] Factory methods accept required data as parameters
- [ ] Returned instance is fully initialized (all required fields set)
