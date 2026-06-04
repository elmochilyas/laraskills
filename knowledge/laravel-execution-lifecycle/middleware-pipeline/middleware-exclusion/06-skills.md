# Skill: Audit Middleware Exclusion in Routes

## Purpose
Review, document, and verify every `withoutMiddleware()` call in the codebase to ensure each exclusion is necessary, correctly implemented, and does not create a security vulnerability.

## When To Use
- Before deploying routes that use `withoutMiddleware()`
- During code review of webhook or public callback endpoints
- As part of regular security audits (quarterly)
- When debugging middleware that runs unexpectedly

## When NOT To Use
- When adding middleware that should never run on any route (remove from stack instead)
- For development-only bypasses (use environment conditions instead)

## Prerequisites
- Laravel project with routes using `withoutMiddleware()`
- Access to run `php artisan route:list -v`
- Knowledge of which middleware classes are in scope

## Inputs
- Route definition with `withoutMiddleware()` calls
- Middleware class names or aliases being excluded

## Workflow
1. Search the codebase for all `withoutMiddleware()` calls with `git grep 'withoutMiddleware'`
2. For each call, identify the route and the middleware being excluded
3. Read the route handler to understand why the exclusion exists
4. Verify the exclusion uses FQCN, not alias strings: `\App\Http\Middleware\VerifyCsrfToken::class` not `'csrf'`
5. Run `php artisan route:list -v` on each excluded route to confirm the middleware is absent from the resolved stack
6. Add a comment explaining the rationale for each exclusion (e.g., "Stripe webhook -- CSRF token cannot be provided")
7. Check that the exclusion is not a development convenience that was accidentally left in
8. Consider whether the middleware should be removed from the group/global stack instead (if it should never apply to this type of route)

## Validation Checklist
- [ ] All `withoutMiddleware()` calls found and reviewed
- [ ] Each exclusion uses FQCN, not alias string
- [ ] `route:list -v` confirms exclusion works
- [ ] Rationale comment present for each exclusion
- [ ] No development-only exclusions remain
- [ ] Exclusions are auditable (documented and tracked)

## Common Failures
- Using alias string instead of FQCN (exclusion silently fails)
- Excluding middleware from wrong source (thinking it's global when it's group-level)
- Forgetting to verify with `route:list -v`
- Leaving dev-convenience exclusions in production
- Excluding `SubstituteBindings` and breaking route model binding

## Decision Points
- Is the excluded middleware needed on this route at all? -> If no, remove from the group/global stack
- Is the exclusion permanent or temporary? -> Permanent: document; Temporary: use env condition
- Does the exclusion bypass security middleware? -> Document why it's safe

## Performance Considerations
- Exclusion check is a simple `in_array()` lookup during middleware gathering
- `ShouldSkipMiddleware` adds one method call per middleware per request
- Exclusion happens once per request during pipeline construction

## Security Considerations
- String mismatch between exclusion and resolved class name = silent exclusion failure
- Auth exclusion opens routes to unauthenticated access
- CSRF exclusion opens POST routes to cross-site request forgery
- Session exclusion breaks any middleware that depends on authenticated user

## Related Rules
- Always Use FQCN in `withoutMiddleware()`, Never Aliases
- Document Every Middleware Exclusion with a Rationale Comment
- Prefer Route-Specific Middleware Assignment Over Global-Plus-Exclude
- Verify Exclusions with `route:list -v` Before Deployment
- Do Not Exclude Security Middleware for Convenience During Development
- Audit All `withoutMiddleware()` Calls Regularly

## Related Skills
- Assign Route Middleware Correctly
- Configure Global Middleware Stack
- Create and Manage Middleware Groups

## Success Criteria
- Every `withoutMiddleware()` call is documented with a rationale
- All exclusions use FQCN and are verified to work
- No security middleware is excluded without documented justification
- A regular audit schedule for exclusions is in place
