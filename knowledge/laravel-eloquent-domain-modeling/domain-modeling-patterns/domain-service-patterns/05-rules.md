# Domain Service Patterns — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | domain-service-patterns |

## Rules

### Rule 1: Extract stateless domain services for cross-model logic
When business logic involves two or more unrelated models and doesn't naturally belong to a single entity, extract it into a stateless domain service.

### Rule 2: Define interfaces for domain services
Domain services should be defined against interfaces to enable testing, mocking, and future implementation swaps.

### Rule 3: Domain services receive models, not fetch them
Services must not call `Model::find()` or query internally. They receive already-loaded models as method parameters.

### Rule 4: Keep domain services free of Eloquent
Domain services must not use Eloquent query builder, facades, or other Laravel infrastructure directly. Use injected repository interfaces for data access.

### Rule 5: Inject services, don't instantiate
Domain service dependencies must be injected via the constructor. Do not use `app()->make()` or `new Service()` inside other domain objects.
