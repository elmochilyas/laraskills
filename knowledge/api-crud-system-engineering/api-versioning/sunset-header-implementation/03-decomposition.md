# Sunset Header Implementation — Phase 3: Operations & Lifecycle

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Phase 3 covers the operational lifecycle of sunset management: enforcing sunset dates, handling sunset extensions, monitoring sunset header visibility, automating the 410 transition, and managing consumer migration windows.

## Core Concepts
- **Sunset Enforcement:** The process of returning 410 Gone on/after the sunset date.
- **Sunset Extension:** When business needs require pushing back a sunset date.
- **Sunset Monitoring:** Tracking which consumers still use endpoints nearing their sunset.
- **Post-Sunset Communication:** What consumers see after the version is removed.

## Mental Models
- **Lease Expiration:** The Sunset date is a lease expiration. When the lease ends, the tenant (version) must vacate. Extensions are possible but require a new agreement (re-communication).
- **Domain Expiration:** Like a domain name expiring. There's a grace period (deprecation), a final expiration (sunset), and a redemption period (maybe 410 for a while). After that, it's gone.

## Internal Mechanics
- A scheduled artisan command checks sunset dates daily. On/after sunset, it updates the version status to `RETIRED`.
- A middleware on retired version routes returns `410 Gone` with a JSON body explaining removal and migration path.
- Sunset extension workflow: update config, notify consumers, verify acknowledgment.
- Consumer migration tracking: daily report of traffic to sunset versions.

## Patterns
- Automated sunset enforcement via scheduled command + config status change.
- Sunset extension process: documented workflow with approval and consumer notification.
- Post-sunset 410 response with link to migration guide and alternative version.
- Sunset date calendar: shared calendar of all upcoming sunset dates for team visibility.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Enforcement method | Config status change + middleware | Reliable, auditable |
| Extension process | Formal approval + notification | Prevents casual extensions |
| Post-sunset period | 410 for 90 days, then 404 | Gradual removal |
| Consumer notification | Automated 30/14/7/1 day before | Multiple reminders |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Strict enforcement | Credibility, predictability | Consumer frustration if unprepared |
| Flexible extensions | Consumer-friendly | Erodes sunset credibility |
| Automated removal | No missed deadlines | Inflexible for business exceptions |
| Manual removal | Human oversight | Can be forgotten |

## Performance Considerations
- Scheduled sunset enforcement runs daily — negligible overhead.
- 410 middleware adds ~0.05ms per request to grandfathered exceptions.
- Post-sunset 410 responses are cacheable (Cache-Control: public, max-age=86400).

## Production Considerations
- Never let a sunset pass silently. If you miss the date, return 410 immediately and apologize.
- Maintain a "sunset log" documenting all sunset events, extensions, and consumer impact.
- Track consumer migration progress weekly for the 3 months leading to sunset.
- When 90% of traffic has migrated, proactively contact the remaining 10%.

## Common Mistakes
- Extending a sunset date multiple times → consumers learn to ignore deadlines.
- Not having a post-sunset 410 response ready (just returns 404 — confusing).
- Changing the sunset date without re-communicating to all affected consumers.
- Enforcing sunset on a date that falls on a weekend or holiday.

## Failure Modes
- **Sunset date failure:** Config typo causes premature enforcement (e.g., 2025 instead of 2026).
- **Consumer non-compliance:** Large consumer hasn't migrated by sunset date — do you extend or break them?
- **Internal dependency:** Internal service still uses the version, sunset blocked by internal politics.
- **Sunset blindness:** Consumer's monitoring doesn't inspect Sunset headers, they don't see the deadline.

## Ecosystem Usage
- **Stripe:** Automated sunset enforcement. Extensions are rare and well-documented.
- **Twilio:** 12-month sunset window. Extensions require executive approval and are publicly noted.
- **GitHub:** Preview feature sunsets published in developer blog and changelog.

## Related Knowledge Units
- **Prerequisites:** Consumer communication, Incident management
- **Related Topics:** Deprecation header implementation, Version retirement policy
- **Advanced Follow-up:** RFC 8594 compliance, Automated sunset management platforms

## Research Notes
### Source Analysis
RFC 8594 (2019) is the foundation. Twilio's public sunset policy (2023) provides a real-world operational model. The concept of "sunset credibility" is discussed in the API Design Practice (2022) literature.

### Key Insight
The sunset date is a promise to your consumers. Every time you extend it, you break that promise. Extend only when the cost of breaking consumers exceeds the cost of maintaining the old version.

### Version-Specific Notes
Laravel 11's `Carbon::create(2026, 12, 31)->toRfc7231String()` generates the correct HTTP-date format for the Sunset header.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization