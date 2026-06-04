# ECC Standardized Knowledge — Phased Deprecation Timeline

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Phased Deprecation Timeline |
| Difficulty | Advanced |
| Category | Governance |
| Last Updated | 2026-06-02 |

## Overview

Phased deprecation moves consumers from an old API version to a new version through defined stages: announce → warn → enforce → remove. This KU covers implementing the four phases as code, configuring phase dates, and building the middleware that enforces phase-specific behavior. The Announce phase is the most important and most frequently skipped — announcing deprecation 6+ months before the Warn phase gives consumers time to plan migration on their schedule, not yours.

## Core Concepts

- **Phase 1 — Announce**: Public notification of upcoming deprecation (blog post, email, dashboard)
- **Phase 2 — Warn**: Deprecation + Sunset headers added to responses
- **Phase 3 — Enforce**: Deprecated endpoints degrade (rate limiting, intentional latency, warning body)
- **Phase 4 — Remove**: Endpoints return 410 Gone
- **Phase Enum**: `PRE_ANNOUNCEMENT`, `ANNOUNCED`, `WARNING`, `ENFORCEMENT`, `REMOVED`
- **Phase Transitions**: Automated or manual transition between phases based on dates
- **Grace Period**: Buffer between Warn and Enforce for consumer migration

## When To Use

- Every API version deprecation with a defined lifecycle
- Public APIs with third-party consumers who need migration time
- Any version removal where consumer impact must be managed
- As part of API lifecycle governance policy

## When NOT To Use

- Internal-only versions with a single known consumer
- Emergency removals (security vulnerabilities) requiring immediate action
- Experimental/pre-release versions (no consumer commitment)

## Best Practices

- **Announce phase should include blog post, email, dashboard notification** — don't skip it.
- **Warn phase must last at least 3-6 months** for public APIs.
- **Enforce phase should be the shortest** (1-2 months).
- **Use a phase enum and config-driven dates** for automated transitions.
- **Provide a "phase status" endpoint** for consumers to check their version's lifecycle status.
- **Track consumer migration percentage** per phase to inform transition timing.
- **Maintain a transition log** for audit trail of phase changes.

## Architecture Guidelines

- Phase machine: `PRE_ANNOUNCEMENT → ANNOUNCED → WARNING → ENFORCEMENT → REMOVED`.
- Config stores phase + dates for each version. Middleware checks phase and applies behavior.
- Scheduled command transitions phases automatically when dates are reached.
- Each phase maps to specific middleware behavior (headers, response changes, rate limiting).
- Always have a "phase rollback" plan — a revert path if a transition causes issues.

## Performance Considerations

- Phase check is a single config lookup — O(1), negligible.
- Enforcement-phase rate limiting adds overhead (rate limiter hit on every request).
- Degradation (intentional latency) added during the Enforce phase — use carefully.

## Security Considerations

- The Announce phase should include security implications of the migration.
- During Enforce phase, ensure rate limiting doesn't cause denial of service for legitimate migration traffic.
- Post-removal 410 should clearly state there is no security support for the removed version.

## Common Mistakes

- Skipping the Announce phase entirely — consumers surprised by warnings.
- Making the Warn phase too short (< 30 days).
- Enforce phase being too harsh (rate limit to 0 is effectively instant removal).
- Not having a clear Removal phase — endpoints just stop working without 410.

## Anti-Patterns

- **Rushed timeline**: Business pressure compresses phases, consumers caught off guard.
- **Infinite enforcement**: Enforce phase never transitions to Remove due to fear.
- **Phase skip**: Bug transitions from Announce directly to Remove.

## Examples

```php
enum DeprecationPhase: string
{
    case PRE_ANNOUNCEMENT = 'pre_announcement';
    case ANNOUNCED = 'announced';
    case WARNING = 'warning';
    case ENFORCEMENT = 'enforcement';
    case REMOVED = 'removed';
}

class PhaseMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $version = $request->attributes->get('api_version');
        $phase = config("api.deprecation.versions.{$version}.phase", DeprecationPhase::ANNOUNCED);

        return match ($phase) {
            DeprecationPhase::ANNOUNCED => $this->handleAnnounced($request, $next),
            DeprecationPhase::WARNING => $this->handleWarning($request, $next),
            DeprecationPhase::ENFORCEMENT => $this->handleEnforcement($request, $next),
            DeprecationPhase::REMOVED => abort(410, 'This API version has been removed.'),
            default => $next($request),
        };
    }
}

// Schedule phase transitions
$schedule->command('api:transition-phases')->daily();
```

## Related Topics

- **Prerequisites**: rest-api-design, crud-architecture, resource-controllers
- **Siblings**: version-retirement-policy, deprecation-header-implementation
- **Advanced**: Multi-phase deprecation automation, Consumer migration tracking

## AI Agent Notes

- The Announce phase is the most important and most frequently skipped. Announcing deprecation 6+ months ahead gives consumers time to plan migration.
- Google's API Design Guide and Microsoft's REST API Guidelines both define the four-phase deprecation model.
- Laravel 11's `RateLimiter` facade supports API rate limiting per version for the Enforce phase.

## Verification

- [ ] Four phases defined and implemented in middleware
- [ ] Phase dates configured for each deprecated version
- [ ] Automated phase transition scheduled (daily)
- [ ] Announce phase includes public communication
- [ ] Warn phase lasts 3-6+ months for public APIs
- [ ] Enforce phase uses rate limiting or degradation (not instant removal)
- [ ] Remove phase returns 410 Gone with migration message
- [ ] Consumer migration percentage tracked per phase
