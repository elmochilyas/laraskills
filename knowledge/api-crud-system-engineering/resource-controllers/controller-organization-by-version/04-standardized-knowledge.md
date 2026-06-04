| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Resource Controllers |
| **Metadata** | Knowledge Unit | Controller Organization by Version |
| **Metadata** | Difficulty | Intermediate |
| **Metadata** | Dependencies | API Resource Controllers |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

As APIs evolve, breaking changes are inevitable. Versioned controller directories — `Controllers/Api/V1/`, `Controllers/Api/V2/` — provide a structural mechanism for maintaining backward compatibility while introducing new behavior. Each version gets its own directory of controllers implementing the same endpoints with different internal logic, request validation, or response formats.

## Core Concepts

- **Namespace-per-Version**: Each API version lives in its own PHP namespace and directory.
- **Versioned Route Files**: Typically `routes/api/v1.php` and `routes/api/v2.php`.
- **Granular Overrides**: V2 controllers can extend V1 controllers to inherit behavior while overriding only what changed.
- **Deprecation Lifecycle**: V1 controllers are deprecated but remain until the deprecation window expires.
- **Parallel Route Registration**: Both versions are registered simultaneously; the client chooses via URL prefix (/v1/, /v2/).

## When To Use

- Public APIs with external clients that cannot be updated simultaneously.
- APIs that have already shipped breaking changes and need versioning.
- Projects maintaining LTS versions alongside active development.
- Any API where backward compatibility is a formal commitment.

## When NOT To Use

- Internal-only APIs where all clients can be updated simultaneously.
- Projects that use header-based or content-negotiation versioning.
- Early-stage APIs still in rapid iteration — versioning adds overhead.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Use URL prefix versioning (`/v1/`, `/v2/`) | Explicit, cacheable, testable, debuggable |
| Duplicate V2 controllers by default; use inheritance only for minor changes | Full duplication prevents accidental V1 regressions |
| Run both V1 and V2 test suites in CI separately | Prevents changes to V2 from breaking V1 |
| Use versioned route name prefixes: `v1.photos.index` | Prevents route name collisions between versions |
| Set a clear deprecation policy (e.g., "V1 deleted 6 months after V2 stable") | Provides timeline for cleanup |

## Architecture Guidelines

- Register each version as a separate route group with distinct prefix and namespace.
- Pin V1 controllers to V1-specific service bindings using contextual binding.
- For minimal changes, extend V1 and override only changed methods.
- Maintain a changelog per version directory.
- Archive old version directories to `_archive/` rather than deleting immediately.

## Performance Considerations

- Route cache size grows linearly with versions × routes — still negligible for practical numbers.
- Only the requested version's controller is autoloaded per request.
- PHP opcode cache handles the increased file count without significant impact.
- Database query differences between versions (e.g., V2 adds eager loads) dominate performance.

## Security Considerations

- Route name collisions between versions can cause unexpected URL generation — use versioned prefixes.
- Missing V2 implementation methods cause 404s for V2 clients — enforce implementation parity.
- Shared services modified for V2 can silently break V1 — pin V1 to dedicated bindings.
- Deprecation headers (`Deprecation`, `Sunset`) should be added to deprecated version responses.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Sharing service instances between V1 and V2 implicitly | DRY obsession | V1 breaks when shared service changes for V2 | Pin V1 controllers to V1-specific bindings |
| Not using inheritance for minor changes | Over-applied "favor composition" | Massive code duplication | Extend V1; override only changed methods |
| Incomplete V2 implementation | Missing methods cause 404s | Clients can't selectively use V2 | Enforce V2 implements same interface as V1 |

## Anti-Patterns

- **No deprecation timeline**: Old versions accumulate indefinitely, bloating the codebase.
- **Header-based versioning as the only method**: Complicates caching, debugging, and client implementation.
- **Sharing service classes between versions without isolation**: Changes for V2 silently break V1.
- **One massive route file for all versions**: Splits into per-version files for clarity.

## Examples

- **Directory structure**: `Controllers/Api/V1/PhotoController.php`, `Controllers/Api/V2/PhotoController.php`
- **Route registration**: `Route::prefix('v1')->group(base_path('routes/api/v1.php')); Route::prefix('v2')->group(base_path('routes/api/v2.php'));`
- **Inheritance**: `class V2PhotoController extends V1PhotoController { public function index() { return V2PhotoResource::collection(...); } }`
- **Deprecation header**: `response()->header('Deprecation', 'true')->header('Sunset', 'Sat, 01 Jun 2027 00:00:00 GMT')`

## Related Topics

- Controller Organization by Domain — Alternative organization strategy
- API Versioning Strategies — Broader versioning approaches
- Controller Testing Strategies — Testing multiple API versions

## AI Agent Notes

- Default to URL prefix versioning — it's the most explicit approach.
- When generating a new version directory, copy the previous version's controllers as a starting point.
- Run V1 and V2 test suites independently in CI.
- Set a deprecation date and add `Sunset` headers from day one of the new version.

## Verification

- [ ] Each version has its own controller directory and namespace
- [ ] Route files are split per version (`routes/api/v1.php`, `routes/api/v2.php`)
- [ ] Route name prefixes are versioned (e.g., `v1.photos.index`, `v2.photos.index`)
- [ ] V2 controllers exist for all V1 controller methods (no missing endpoints)
- [ ] V1 and V2 test suites run independently in CI
- [ ] Deprecated versions have `Deprecation` and `Sunset` headers
- [ ] Shared services are pinned per version when behavior differs
