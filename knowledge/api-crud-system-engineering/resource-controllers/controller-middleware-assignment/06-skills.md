# Skill: Implement Controller Middleware Assignment

## Purpose
Assign middleware to controllers and actions via route definitions, `Route::apiResource()->middleware()`, or `Route::middleware()` groups — not in controller constructor.

## When To Use
- Controller middleware configuration
- Route-based middleware assignment
- Centralized middleware management

## When NOT To Use
- Controller constructor middleware — prefer route assignment
- Global middleware

## Workflow
1. Assign middleware in route definition: `Route::apiResource('users', UserController::class)->middleware('auth:sanctum')`
2. Use route groups for shared middleware: `Route::middleware('auth:sanctum')->group(...)`
3. Specify middleware per action: `->middleware('throttle:login')->only('store')`
4. Use `except()` for middleware exclusion on specific actions
5. Assign auth middleware at group level, not per-resource
6. Assign rate limit middleware at action level
7. Keep middleware in routes file — not controller constructor
8. Use middleware parameters for configurable behavior
9. Test middleware application per action
10. Document middleware assignment conventions

## Validation Checklist
- [ ] Middleware assigned in route definitions
- [ ] auth middleware at group level
- [ ] rate limit at action level
- [ ] Not in controller constructor
- [ ] only()/except() for per-action control
- [ ] Tested per action

## Related Skills
- API-Specific Middleware
- Rate Limiter Definitions
- Resource Controller Methods
