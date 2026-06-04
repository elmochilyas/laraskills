# Phased Deprecation Timeline — Phase 2: Implementation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Phased deprecation moves consumers from an old API version to a new version through defined stages: announce → warn → enforce → remove. Phase 2 covers implementing the four phases as code, configuring phase dates, and building the middleware that enforces phase-specific behavior.

## Core Concepts
- **Four Phases:**
  1. **Announce** — Public notification of upcoming deprecation
  2. **Warn** — Deprecation + Sunset headers added to responses
  3. **Enforce** — Deprecated endpoints degrade (slower, warning body, reduced support)
  4. **Remove** — Endpoints return 410 Gone
- **Phase Configuration:** Dates for each phase stored in config.
- **Phase Transitions:** Automated or manual transition between phases.
- **Grace Period:** A buffer between Warn and Enforce for consumer migration.

## Mental Models
- **Construction Timeline:**
  - Announce: "We're planning to renovate this bridge in 2026."
  - Warn: "Bridge renovation starts Dec 31. Find alternate routes."
  - Enforce: "Bridge under renovation. Single lane, expect delays."
  - Remove: "Bridge closed. Use alternate route."
- **Software EOL Lifecycle:** Like Windows XP end-of-life: announced years in advance, then warnings, then extended support (paid), then complete removal.

## Internal Mechanics
- Phase enum: `PRE_ANNOUNCEMENT`, `ANNOUNCED`, `WARNING`, `ENFORCEMENT`, `REMOVED`.
- Config stores phase + dates for each version. Middleware checks phase and applies behavior.
- Scheduled command transitions phases automatically when dates are reached.
- Each phase maps to specific middleware behavior (headers, response changes, rate limiting).

## Patterns
- Phase machine: `PRE_ANNOUNCEMENT → ANNOUNCED → WARNING → ENFORCEMENT → REMOVED`.
- Config-driven phase dates for each version.
- Middleware that switches behavior based on current phase.
- Transition log: audit trail of phase changes for compliance.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Phase storage | Config array | Simple, version-controlled |
| Phase transition | Automated by date | Reliable, consistent |
| Enforcement action | Rate limiting + degradation | Incentivizes migration |
| Remove action | 410 Gone with message | Clear final state |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Automated phases | No missed transitions | Rigid schedule |
| Manual phases | Human judgment, flexibility | Can be forgotten |
| Hard enforcement (rate limit) | Strong migration incentive | Consumer frustration |
| Soft enforcement (header only) | Consumer-friendly | Slow migration |

## Performance Considerations
- Phase check is a single config lookup — O(1), negligible.
- Enforcement-phase rate limiting adds overhead (rate limiter hit on every request).
- Degradation (intentional latency) can be implemented as middleware sleep — use carefully.

## Production Considerations
- Announce phase should include blog post, email, dashboard notification.
- Warn phase must last at least 3-6 months for public APIs.
- Enforce phase should be the shortest (1-2 months).
- Include a "phase status" endpoint for consumers to check their version's lifecycle status.

## Common Mistakes
- Skipping the Announce phase entirely (consumers surprised by warnings).
- Making the Warn phase too short (< 30 days).
- Enforce phase being too harsh (rate limit to 0 is effectively instant removal).
- Not having a clear Removal phase — endpoints just stop working without 410.

## Failure Modes
- **Rushed timeline:** Business pressure compresses phases, consumers caught off guard.
- **Phase skip:** Bug transitions from Announce directly to Remove.
- **Infinite enforcement:** Enforce phase never transitions to Remove due to fear.
- **Consumer unawareness:** Consumer not reading headers or emails, misses all phases until removal.

## Ecosystem Usage
- **Stripe:** Multiple deprecation phases with clear timelines in API changelog.
- **Twilio:** 12-month phased deprecation with automated notifications at each phase.
- **GitHub:** Preview features go through announce → warn → graduate or remove.

## Related Knowledge Units

### Prerequisites
- rest-api-design
- crud-architecture
- resource-controllers

### Related Topics
- Version retirement policy
- Breaking change identification

### Advanced Follow-up Topics
- Multi-phase deprecation automation
- Consumer migration tracking

## Research Notes
### Source Analysis
The four-phase deprecation model is documented in Google's API Design Guide (2023) and Microsoft's REST API Guidelines (2022). Twilio's API deprecation policy (2023) provides a real-world example.

### Key Insight
The Announce phase is the most important and most frequently skipped. Announcing deprecation 6+ months before the Warn phase gives consumers time to plan migration on their schedule, not yours.

### Version-Specific Notes
Laravel 11's `RateLimiter` facade supports API rate limiting per version. Use named rate limiters per deprecation phase.
