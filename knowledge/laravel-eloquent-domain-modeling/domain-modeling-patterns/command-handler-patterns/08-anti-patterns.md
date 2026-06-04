# Command Handler Patterns — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | command-handler-patterns |

## Anti-Patterns

### Fat Handlers with Inline Business Logic
- **Severity:** High
- **Problem:** The handler contains if/else blocks, calculations, and state changes instead of calling domain methods on models. The handler becomes a procedural script that duplicates domain knowledge.
- **Solution:** Extract business logic to model domain methods. The handler should only sequence calls to those methods.

### Using Eloquent Models Directly in Handlers
- **Severity:** Medium
- **Problem:** The handler calls `User::where(...)` or `DB::table(...)` directly instead of using injected repositories or domain services.
- **Solution:** Inject repository interfaces or domain services into the handler. Keep persistence concerns abstracted.

### Command DTOs with Behavior
- **Severity:** Medium
- **Problem:** Adding methods, validation logic, or computed properties to command DTOs blurs the line between data carrier and domain object.
- **Solution:** Keep DTOs as pure data carriers with readonly properties. Validation belongs in form requests or dedicated validators.

### Handlers Doing HTTP Work
- **Severity:** High
- **Problem:** The handler returns a redirect response, sets cookies, or flashes session data — coupling the handler to HTTP concerns.
- **Solution:** Handlers return data or result DTOs. The controller handles HTTP-specific concerns (responses, redirects, session).
