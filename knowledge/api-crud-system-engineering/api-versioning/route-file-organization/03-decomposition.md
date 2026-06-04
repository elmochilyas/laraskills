# Route File Organization — Phase 3: Operations & Lifecycle

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Phase 3 covers the operational lifecycle of route files: managing route file deprecation, removing retired version routes, ensuring route cache hygiene, monitoring route registration, and coordinating route changes across deployment environments.

## Core Concepts
- **Route File Deprecation:** Marking a version's route file as deprecated with comments and warnings.
- **Route File Removal:** Safely removing route file loading for retired versions.
- **Route Cache Lifecycle:** Managing cached routes across deploys, ensuring old caches don't serve new requests.
- **Route Registration Audit:** Automated checks that all expected routes are registered per version.

## Mental Models
- **Airline Route Map:** Route files are airline schedules. V1 is the 2020 schedule (some routes suspended). V2 is the 2024 schedule (new routes, some old routes dropped). The schedule board (RouteServiceProvider) shows active schedules only.
- **Restaurant Menu:** Each version is a seasonal menu. The kitchen (route files) prepares different dishes for each season. Past menus are archived but no longer cooked.

## Internal Mechanics
- Route registration checksum: a CI step computes a hash of all registered routes and compares it to the expected route manifest.
- Route loading condition: `if (config('api.versions.v1.active'))` guards allow turning versions on/off via config.
- Retired version files remain in the repository but are not loaded by `RouteServiceProvider`.
- A `route:audit` artisan command lists all registered routes by version prefix.

## Patterns
- Version-enabled config: `config('api.versions.v1.active')` controls if route file is loaded.
- Route manifest file: `routes/manifest.json` listing active versions with their lifecycle status.
- Dead route detection: scheduled job comparing route:list output against expected routes.
- Graceful route removal: V1 routes loaded but middleware returns 410 Gone for all endpoints.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Route retirement | Config gate vs file removal | Config gate allows emergency restore |
| Route manifest | Auto-generated vs manual | Auto-generated is always accurate |
| Dead route detection | CI check on deploy | Catches accidental removal |
| Old route files | Keep in repo vs delete | Keep for historical reference |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Config-gated routes | Toggle without deploy | Config drift between environments |
| File removal | Clean repo | Harder to restore if needed |
| Route manifest | Contract validation | Must be maintained |
| 410 instead of 404 | Clearer to consumers | More middleware overhead |

## Performance Considerations
- Config-gated route loading adds negligible overhead (one `config()` call per version).
- Route manifest validation runs in CI, zero production cost.
- 410 middleware adds ~0.05ms per request to deprecated versions.
- Route cache file size decreases when retired versions are unloaded.

## Production Considerations
- Route removal must be a coordinated release: announce, wait, then remove.
- Verify route removal with a canary deployment before full rollout.
- Keep route cache as part of the deploy artifact; never regenerate at runtime.
- When removing routes, update monitoring alerts to expect 404/410 on those endpoints.

## Common Mistakes
- Deleting a route file before confirming zero traffic.
- Removing route file from `RouteServiceProvider` but not removing the file — dead code.
- Forgetting to update API documentation when routes are removed.
- Not coordinating route removal with dependent services (webhooks, callbacks).

## Failure Modes
- **Premature removal:** Route file removed, consumer still sending traffic → 404 errors.
- **Stale cache in deployment:** Blue-green deploy has old server with cached routes, new server without them.
- **Config mismatch:** Staging has V1 routes active, production does not — testing false negatives.
- **Documentation desync:** Route removed but API docs still show it, consumers confused.

## Ecosystem Usage
- **Twilio:** Date-based route versioning with documented route deprecation timelines.
- **Stripe:** Route versions maintained in source with clear lifecycle markers in route files.
- **GitHub API:** Route files archived but not loaded after version retirement, with clear commit history.

## Related Knowledge Units
- **Prerequisites:** Deployment strategies, Blue-green deployments
- **Related Topics:** Version retirement policy, Phased deprecation timeline
- **Advanced Follow-up:** API gateway route management, Service mesh route versioning

## Research Notes
### Source Analysis
ThoughtWorks Tech Radar (2023) documents "route hygiene" as a microservice best practice. Stripe's deployment engineering blog (2022) details their route version lifecycle.

### Key Insight
Route files are the cheapest thing to version — they're just PHP arrays. The operational challenge is not the files themselves but coordinating their lifecycle with consumers, documentation, and deployment processes.

### Version-Specific Notes
Laravel 11's `RouteServiceProvider` uses `loadRoutesFrom()` internally. The same pattern works across all Laravel versions 8+.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization