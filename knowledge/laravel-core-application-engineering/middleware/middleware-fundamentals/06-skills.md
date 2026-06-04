# Skill: Implement a Correct handle() Method with Two-Pass Execution

## Purpose

Write a middleware `handle()` method that correctly uses the two-pass execution model — pre-processing code before `$next($request)` and post-processing code after — and always returns a Response on every code path.

## When To Use

When writing any middleware class, during code review of existing middleware, or when debugging response-related issues.

## When NOT To Use

Middleware that only logs or measures (no request modification) may place all logic after `$next($request)`.

## Prerequisites

- Understanding of the Pipeline pattern and nested closure chain
- Knowledge of the three execution paths

## Inputs

- Middleware purpose (pre-processing, post-processing, or combined)

## Workflow

1. Declare `public function handle(Request $request, Closure $next): Response`
2. Place request modification code BEFORE `$next($request)` — this runs on the inbound pass
3. Call `$response = $next($request)` — this passes control to the next middleware
4. Place response modification code AFTER `$next($request)` — this runs on the outbound pass
5. Always `return $response` — never call `$next($request)` as a statement without returning
6. For short-circuit paths, `return response(...)` or throw an exception — never call `$next`
7. Use local variables only for per-request data — never `$this->property`

## Validation Checklist

- [ ] Pre-processing code is before `$next($request)`
- [ ] Post-processing code is after `$next($request)`
- [ ] Every code path returns a `Response` object
- [ ] `$next($request)` result is captured with `$response = $next($request)` — NOT called as a statement
- [ ] No instance properties for per-request data
- [ ] Short-circuit paths do not call `$next`

## Common Failures

- Forgetting `return` before `$next($request)` — produces empty 200 response silently
- Placing request modifications after `$next($request)` — they run during the outbound pass, too late
- Calling `$next($request)` twice — the second call re-executes downstream middleware
- Storing per-request data on `$this->property` — leaks across requests in Octane

## Decision Points

- For guard middleware (auth, role check), place the condition before `$next` and return a short-circuit response
- For logging middleware, place all logic after `$next` to capture the completed response
- For combined middleware (timing), place start time before `$next` and duration calculation after

## Performance Considerations

Properly structured middleware adds ~0.01-0.05ms closure allocation. Short-circuit middleware saves downstream execution cost. Incorrectly placed code may cause bugs that require debugging time.

## Security Considerations

Guard short-circuits must return a response with appropriate status code and headers. Short-circuit responses bypass downstream middleware that would add security headers — ensure short-circuit responses include necessary headers.

## Related Rules

- Always Return the Result of $next($request) (middleware-fundamentals:5)
- Place Pre-Processing Code Before $next and Post-Processing Code After (middleware-fundamentals:5)
- Never Place Business Logic in Middleware (middleware-fundamentals:5)
- Do Not Store Per-Request State on Middleware Instance Properties (middleware-fundamentals:5)

## Related Skills

- Implement Custom Middleware with Single-Responsibility Pattern
- Implement a Request Transformation Middleware for Request Enrichment

## Success Criteria

Middleware `handle()` method has pre-processing before `$next`, post-processing after, returns Response on all paths, uses only local variables, and correctly captures the `$next` result.

---

# Skill: Identify and Fix Business Logic Leaking into Middleware

## Purpose

Detect business logic that has been incorrectly placed in middleware and refactor it to the appropriate service or action layer.

## When To Use

During code review, when debugging middleware that queries domain models, when a middleware's purpose description includes business rules, or during architecture refactoring.

## When NOT To Use

Middleware that performs lightweight, read-only service lookups (tenant by domain, user preferences) for HTTP-level decisions (locale, redirect) is acceptable.

## Prerequisites

- Knowledge of the cross-cutting concern boundary
- Understanding of HTTP primitives vs domain primitives

## Inputs

- Middleware source code
- Business rules that the middleware enforces

## Workflow

1. Read the middleware and identify any operations on domain models, business rules, calculations, or side effects
2. Ask: "Is this operating on HTTP primitives (headers, request, response, status codes, session)?" — if yes, keep in middleware
3. Ask: "Is this operating on domain primitives (models, entities, business rules, repositories)?" — if yes, extract to a service/action
4. If both, split: create middleware for the HTTP part, service for the domain part
5. Extract domain logic into a service class with a single method
6. Remove the domain logic from the middleware — optionally use `$request->attributes` to pass resolved HTTP data
7. The controller calls the service independently — middleware does not call the service

## Validation Checklist

- [ ] No Eloquent queries in middleware (except lightweight, cached lookups)
- [ ] No business rule evaluation (eligibility, calculations, tier logic) in middleware
- [ ] No side effects from domain operations (database writes, API calls, email sends) in middleware
- [ ] Extracted service is independently testable without HTTP simulation
- [ ] Middleware only communicates via `$request->attributes` — not by calling services

## Common Failures

- "It runs before the controller, so it's the right place to check this" — this is the most common rationalization
- Middleware that checks discount eligibility, order totals, or subscription tier — these are business rules
- Middleware that writes audit logs to the database — this is a side effect that belongs in a service
- Controllers that manually check `Auth::check()` — duplicates middleware functionality

## Decision Points

- If the middleware calls a service for a read-only lookup (tenant by domain), the lookup is acceptable
- If the middleware calls a service with side effects, the call must move to the controller

## Performance Considerations

Business logic in middleware often adds database queries to every request. Extracting to a service allows the controller to decide when the business logic runs.

## Security Considerations

Business logic in middleware bypasses controller-level authorization. An order eligibility check running in middleware executes even for users who should not access the order edit endpoint.

## Related Rules

- Never Place Business Logic in Middleware (middleware-fundamentals:5)
- Never Split a Single Concern Across Middleware and Controller Logic (cross-cutting-concerns:5)

## Related Skills

- Apply the Cross-Cutting Boundary Test to New Middleware

## Success Criteria

No domain logic remains in middleware. Extracted services are independently testable. Middleware operates only on HTTP primitives.
