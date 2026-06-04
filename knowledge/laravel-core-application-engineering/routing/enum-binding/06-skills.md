# Skill: Bind Backed Enum Values from Route Parameters

## Purpose

Use PHP backed enums as route parameter type hints so that Laravel automatically resolves URL segments to enum cases, eliminating manual `tryFrom()` boilerplate and ensuring type-safe enum values in controller methods.

## When To Use

- Route parameters representing enum values (status, type, category, role)
- API filters where the filter value is an enum
- Workflow states in URL patterns

## When NOT To Use

- Non-backed enums (pure enums cannot be bound — only `: string` or `: int` backed enums work)
- Enum values that should not be exposed in URLs
- When the enum value needs additional validation beyond case matching
- When the enum value comes from a request body or query parameter (not a route parameter)

## Prerequisites

- PHP 8.1+ backed enum definition
- Route parameter type-hinted with the enum class in the controller/closure
- Understanding that invalid values return 404, not validation errors

## Inputs

- Backed enum class (string or integer backed)
- Route URI with the enum parameter
- Controller method signature with the enum type hint

## Workflow

1. Define a backed enum with `: string` or `: int` backing type and the relevant cases
2. Add a route parameter for the enum value: `/posts/{status}`
3. Type-hint the enum in the controller method: `public function index(PostStatus $status)`
4. Verify that valid URL segments resolve to the correct enum case
5. Verify that invalid URL segments return 404 automatically
6. Optionally add `->whereIn()` regex constraint for early rejection of invalid formats
7. Add authorization checks in the controller — enum binding does not replace authorization

## Validation Checklist

- [ ] Enum is backed (`: string` or `: int`) — not a pure enum
- [ ] Route parameter type-hint uses the fully qualified enum class
- [ ] Controller does NOT contain manual `tryFrom()` for this parameter
- [ ] Invalid URL segments return 404, not 500
- [ ] Authorization is applied independently of enum binding
- [ ] Regex constraint added for additional format validation (optional)

## Common Failures

### Using pure enums
Pure enums throw `BindingResolutionException` because `tryFrom()` is only available on backed enums. Always use `: string` or `: int` backing for route-bound enums.

### Manual tryFrom() in controllers
Writing `PostStatus::tryFrom($request->status) ?? abort(404)` duplicates framework behavior. Type-hint the enum directly and let implicit binding handle resolution.

### Assuming binding for non-enum types
Type-hinting a string or other non-enum type will not trigger enum binding. Only backed enum type hints trigger automatic resolution.

## Decision Points

### String-backed vs Integer-backed?
String-backed enums produce readable URL segments (`/posts/draft`). Integer-backed enums produce numeric segments (`/users/1`). Prefer string-backed for public URLs.

### Regex constraint or not?
Add `->whereIn()` or `->where()` constraints when the enum set is large or when different error granularity is needed. For small static sets, `tryFrom()` alone is sufficient.

## Performance Considerations

Enum binding uses `tryFrom()` which is O(1) — negligible performance cost. No database query is involved. Adding regex constraints has no measurable overhead.

## Security Considerations

- Enum binding does NOT replace authorization — a valid enum value in the URL does not mean the user is authorized to access the resource
- Always apply authorization checks (policies, gates, middleware) independently of enum binding
- Exposing enum values in URLs may leak information about available states/categories

## Related Rules

- Use Backed Enums for Route Parameters
- Reject Manual tryFrom() in Controllers
- Apply Regex Constraints for Additional Validation
- Do Not Use Enum Binding as Authorization

## Related Skills

- Implement Implicit Route Model Binding
- Define Application Routes
- Implement Route Model Binding (Explicit)

## Success Criteria

- Valid enum URL segments resolve to the correct enum case
- Invalid enum URL segments return 404 automatically
- Controller methods receive typed enum instances, not raw strings
- No manual `tryFrom()` boilerplate exists for route parameters
- Authorization checks are applied independently from enum resolution
