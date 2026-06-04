# Skill: Determine Correct Pipeline Placement Based on Route Context Requirements

## Purpose

Decide whether a middleware belongs in the global pipeline (before routing) or the route pipeline (after routing) based on whether it needs access to the matched route, route parameters, or model bindings.

## When To Use

When registering any new middleware, when debugging middleware that crashes with a null route object, or when reviewing existing middleware placement.

## When NOT To Use

Path-based middleware (checking `$request->is()`, `$request->path()`, `$request->segment()`) can run globally because it operates on the URI string, not the matched route object.

## Prerequisites

- Understanding of the two-pipeline architecture
- Knowledge of the middleware lifecycle phases

## Inputs

- Middleware code
- Registration file (bootstrap/app.php or Kernel.php)

## Workflow

1. Read the middleware source and identify every use of `$request->route()`, route parameters, or model bindings
2. If the middleware accesses route data (`$request->route()`, `$request->route('param')`, route model bindings), it MUST be in the route pipeline — register at group or route level
3. If the middleware operates on request primitives only (URI, headers, method, input), it can be in the global pipeline
4. If the middleware must run before routing (TrustedProxies, CORS, maintenance mode), it MUST be global
5. Verify the registration file places the middleware in the correct pipeline

## Validation Checklist

- [ ] Middleware that accesses `$request->route()` is NOT registered as global
- [ ] Global middleware only contains infrastructure concerns (TrustedProxies, HandleCors, TrimStrings)
- [ ] Path-based middleware (`$request->is()`) is correctly identified as safe for global
- [ ] Route pipeline middleware has access to all needed route context
- [ ] No middleware is registered globally that needs the matched route for authentication, authorization, or rate limiting

## Common Failures

- Auth middleware registered globally — `$request->route()` returns null, causing null reference errors
- Role-checking middleware registered globally — cannot access the matched route to determine required role
- SubstituteBindings middleware removed from route pipeline — route model bindings do not resolve

## Decision Points

- If the middleware checks `$request->path()` or `$request->is()`, it can be global — these operate on the URI string
- If the middleware needs `$request->route()->parameter()`, it must be in the route pipeline
- If the middleware needs model bindings, it must run after SubstituteBindings in the route pipeline

## Performance Considerations

Global middleware runs on every request including health checks. Moving non-essential middleware from global to route pipeline reduces execution footprint.

## Security Considerations

Middleware placed in the wrong pipeline may silently fail to execute its security checks. A global auth middleware that crashes with a null reference does not protect routes.

## Related Rules

- Differentiate Global and Route Pipeline Placement by Route Context Requirement (middleware-lifecycle:5)
- Do Not Register Global Middleware That Requires Route Context (global-route-group-middleware:5)

## Related Skills

- Choose the Correct Registration Tier for Middleware

## Success Criteria

Every middleware is placed in the correct pipeline. Global middleware does not access route data. Route pipeline middleware has full access to matched route context. No null reference errors from route access.

---

# Skill: Keep Controller Constructors Lightweight for Middleware-Aware Design

## Purpose

Design controller constructors to avoid expensive initialization that executes even when middleware short-circuits the request, preventing wasted resources on unauthorized requests.

## When To Use

When writing new controllers, refactoring existing controllers with heavy constructors, or investigating slow responses for unauthenticated requests.

## When NOT To Use

Controllers with no guard middleware (public routes that are always accessible) have no constructor weight constraint.

## Prerequisites

- Understanding of controller instantiation timing (before middleware runs)
- Knowledge of which middleware guards the controller's routes

## Inputs

- Controller constructor code
- Route middleware configuration for the controller

## Workflow

1. Identify all controllers that have guard middleware (auth, role check, subscription check)
2. For each controller, review the constructor for expensive operations: database queries, API calls, service initialization, file reads
3. Move expensive initialization from the constructor to the specific controller methods that need them
4. Keep constructor only for dependency injection (property assignment) — no side effects
5. For data loaded eagerly, switch to lazy loading or method-level initialization

## Validation Checklist

- [ ] Constructor does not call any database query methods
- [ ] Constructor does not make API calls or HTTP requests
- [ ] Constructor does not write to files, logs, or external services
- [ ] Constructor only assigns injected dependencies to properties
- [ ] Expensive initialization happens in controller methods, not constructor

## Common Failures

- Analytics loading in constructor — runs even for 401 responses from auth middleware
- User profile eager loading in constructor — runs for every matched route regardless of authorization
- Expensive service resolution in constructor — resolved even when middleware will short-circuit

## Decision Points

- If a dependency is always needed, inject it in the constructor but do not call methods on it
- If a dependency is conditionally needed (only some methods), use lazy injection or resolve in the method
- If shared data is needed across methods, consider using middleware to resolve and store on `$request->attributes`

## Performance Considerations

A controller constructor with a 50ms database query adds 50ms to every matched route, including unauthorized requests that auth middleware will short-circuit. For 1000 unauthorized requests/second, this wastes 50 seconds of database time per second.

## Security Considerations

Side effects in constructors (audit logs, notification sends) execute for attackers who trigger auth failures, potentially filling logs or sending unwanted notifications.

## Related Rules

- Keep Controller Constructors Lightweight — They Execute Before Middleware Short-Circuits (middleware-lifecycle:5)
- Understand Controller Instantiation Happens Before Middleware (middleware-fundamentals:5)

## Related Skills

- Determine Correct Pipeline Placement Based on Route Context Requirements

## Success Criteria

Controller constructors perform only dependency injection with no side effects. No database queries, API calls, or expensive initialization occurs before middleware executes.
