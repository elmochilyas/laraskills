# Domain Service Patterns — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | domain-service-patterns |

## Anti-Patterns

### Domain Services with Eloquent Queries
- **Severity:** High
- **Problem:** The service calls `User::where('active', true)->get()` directly, coupling domain logic to Eloquent and making it untestable without a database.
- **Solution:** Inject a repository interface and pass it the query criteria. The service calls the repository, not Eloquent directly.

### Stateful Domain Services
- **Severity:** High
- **Problem:** The service maintains internal state (e.g., caching results in a property) between method calls, causing unpredictable behavior and thread-safety issues.
- **Solution:** Domain services must be stateless. Cache externally (e.g., Laravel cache) or pass cached values as parameters.

### Single-Model Logic in Services
- **Severity:** Medium
- **Problem:** Extracting logic that only operates on a single model's state into a domain service, when it could be a model domain method.
- **Solution:** Keep logic that operates on a single model's state on the model itself. Only extract to services for cross-model logic.

### Services That Fetch Their Own Data
- **Severity:** Medium
- **Problem:** The service receives an ID and internally loads the model with `Model::findOrFail()`, making the service impervious to caller-side optimizations like eager loading.
- **Solution:** Services receive already-loaded models. The caller is responsible for loading and passing the required data.
