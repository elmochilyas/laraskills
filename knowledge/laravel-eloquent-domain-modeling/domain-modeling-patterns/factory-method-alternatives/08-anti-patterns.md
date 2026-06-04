# Factory Method Alternatives — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | factory-method-alternatives |

## Anti-Patterns

### Factory Methods That Always Persist
- **Severity:** Medium
- **Problem:** The factory method calls `save()` internally, preventing callers from inspecting or modifying the instance before persistence. If creation fails validation, a partial record may exist.
- **Solution:** Factory methods should create and return unsaved instances. Provide a separate `create()` method if create-and-save is needed.

### Generic Factory Method Names
- **Severity:** Medium
- **Problem:** Using `create()` or `newInstance()` as factory method names hides the creation intent. Callers must read the implementation to understand what kind of instance is created.
- **Solution:** Use expressive names like `draftForCustomer()`, `standardSubscription()`, `trialAccount()`.

### Factory Methods with Service Dependencies
- **Severity:** High
- **Problem:** The factory method calls `TaxService::getRate()` or `Mail::send()` during creation, coupling instantiation to external services and making testing difficult.
- **Solution:** Factory methods must be pure — create the instance from passed parameters only. External service calls belong in the caller or in domain events.

### Factory Methods on Wrong Models
- **Severity:** Medium
- **Problem:** Placing a factory method for OrderItems on the Product model because it needs product data, creating inappropriate coupling.
- **Solution:** Factory methods belong on the model they create. Pass required data (e.g., product info) as parameters instead of accessing other models.
