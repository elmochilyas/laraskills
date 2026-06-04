# Domain Service Patterns — Checklists

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | domain-service-patterns |

## Validation Checklist

- [ ] Service is stateless (no mutable properties)
- [ ] Domain interface is defined for the service
- [ ] Service receives models as parameters (doesn't fetch them)
- [ ] Business logic belongs to no single model
- [ ] Service is injected, not instantiated internally
- [ ] No Eloquent queries in the service (use injected repositories)
- [ ] Service is testable with mocked dependencies
- [ ] Service is registered in a service provider for DI
