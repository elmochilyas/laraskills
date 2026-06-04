# Transaction Script Refactoring — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | transaction-script-refactoring |

## Anti-Patterns

### Extracting to Services Instead of Models
- **Severity:** Medium
- **Problem:** Business logic is extracted from the controller into a service class instead of into the model. The service becomes a fat transaction script in a different file.
- **Solution:** Extract single-model logic to model domain methods. Use domain services only for cross-model logic. Use action classes only for application-layer orchestration.

### Keeping Side Effects Inline in Domain Methods
- **Severity:** High
- **Problem:** After extraction, the domain method sends emails, makes API calls, or writes logs inline — coupling the domain logic to infrastructure.
- **Solution:** Dispatch a domain event from the method and move side effects to event listeners. The domain method remains pure and testable.

### Leaving Dead Logic in Controllers
- **Severity:** Medium
- **Problem:** After extracting the main business logic, some conditions or assignments remain in the controller "just in case," creating confusion about where the logic lives.
- **Solution:** Completely extract or delete all business logic from the controller. If a condition remains, it should be a pure HTTP concern (redirect, response format).

### Not Updating Tests After Refactoring
- **Severity:** High
- **Problem:** HTTP controller tests remain as the only coverage for business logic, even though the logic now lives in a domain method. The model method has no direct tests.
- **Solution:** Write unit tests for the extracted domain method. Simplify controller tests to verify orchestration only.
