# Request Lifecycle Integration — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | request-lifecycle-integration |

## Rules

### Rule: Use FormRequest for Endpoint-Specific Validation
- **Condition:** When validation is specific to a single endpoint or resource
- **Action:** Create a dedicated FormRequest class. Inject it into the controller method.
- **Consequence:** Validation lives with the endpoint it validates; maintainability improves.
- **Enforcement:** Review flags validation logic in controllers or middleware for endpoint-specific rules.

### Rule: Validate After Auth for User-Dependent Rules
- **Condition:** When validation rules depend on the authenticated user's data
- **Action:** Place `auth` middleware before the FormRequest in the route definition. Reference `$this->user()` in rules.
- **Consequence:** User data is available during rule evaluation; rules can adapt per user.
- **Enforcement:** Integration test verifies user context is available during validation.

### Rule: Keep Middleware for Cross-Cutting Concerns Only
- **Condition:** When validation logic applies to multiple unrelated endpoints
- **Action:** Implement as middleware and register in the global HTTP kernel or route group.
- **Consequence:** Shared validation runs once per request; endpoint-specific logic stays in FormRequests.
- **Enforcement:** Review ensures middleware validation is truly cross-cutting, not endpoint-specific.

### Rule: Don't Call Validation from authorize()
- **Condition:** When implementing the `authorize()` method in FormRequests
- **Action:** Keep `authorize()` focused on authorization (policy gates). Never call validation logic or check input data in authorize().
- **Consequence:** Authorization and validation remain separate concerns; error messages are distinct.
- **Enforcement:** Review ensures `authorize()` contains only policy/gate checks.

### Rule: Use `after` Middleware for Post-Validation Processing
- **Condition:** When logic must execute after validation but before the controller
- **Action:** Register a `TerminableMiddleware` or use `$request->afterValidation()` pattern via custom FormRequest base class.
- **Consequence:** Post-validation processing (logging, metrics) runs only for valid requests.
- **Enforcement:** Review ensures post-validation logic is not embedded in validation methods.
