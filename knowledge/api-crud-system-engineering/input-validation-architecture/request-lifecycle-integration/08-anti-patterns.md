# Request Lifecycle Integration — Anti-Patterns

## Validation Logic in Middleware
**Description:** Implementing endpoint-specific validation rules in middleware instead of FormRequests.
**Why it happens:** Developers follow a "middleware-first" pattern for all request processing.
**Consequences:** Middleware becomes cluttered with endpoint-specific rules; rules are harder to find and maintain; error handling is inconsistent.
**Better approach:** Use FormRequests for endpoint validation. Use middleware only for truly cross-cutting concerns (CORS, content-type enforcement).

## Calling Auth from Within Validation Rules
**Description:** Querying the authenticated user inside rule closures or custom rule classes without proper authorization checks.
**Why it happens:** Developers need user context for conditional rules and assume auth has already run.
**Consequences:** If the route doesn't have auth middleware, `$this->user()` returns null; validation behaves differently depending on middleware ordering.
**Better approach:** Explicitly require auth middleware on the route when validation depends on user data. Document this dependency.

## Business Logic in authorize() Method
**Description:** Performing expensive database queries, calling external APIs, or triggering side effects in the `authorize()` method.
**Why it happens:** Developers treat `authorize()` as a convenient hook that runs early.
**Consequences:** `authorize()` runs before validation; invalid input triggers unnecessary expensive operations. Side effects happen even for invalid requests.
**Better approach:** Keep `authorize()` lightweight — policy checks only. Move expensive pre-validation logic to middleware or early in the controller.

## Skipping FormRequest for "Simple" Endpoints
**Description:** Validating inline in the controller with `$request->validate()` instead of creating a FormRequest.
**Why it happens:** Developers judge that simple endpoints don't warrant a separate class.
**Consequences:** Validation logic is scattered across controllers; cannot be reused; cannot easily add authorization or custom error formatting.
**Better approach:** Create a FormRequest for every state-changing endpoint (POST, PUT, PATCH). Inline validation is acceptable for GET parameter validation.
