# Deprecation Header Implementation — Phase 3: Operations & Lifecycle

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Phase 3 covers the operational lifecycle of deprecation headers: managing deprecation schedules, monitoring deprecation header visibility, coordinating deprecation with consumer outreach, and removing deprecation headers when the version is retired.

## Core Concepts
- **Deprecation Schedule:** Timeline of when each version or endpoint was deprecated and when it will be removed.
- **Deprecation Visibility Tracking:** Monitoring API consumer tooling to ensure deprecation headers are visible.
- **Consumer Outreach:** Automated or manual communication with consumers hitting deprecated endpoints.
- **Deprecation Resolution:** Removing the deprecation header when consumers have migrated or the version is retired.

## Mental Models
- **Expiration Date Tracking:** The deprecation header is an expiration date on a food product. The date is set (Sunset), the warning (Deprecation) starts at a defined point before expiration. After expiration, the product is removed.
- **Construction Detour Signs:** Deprecation is the "ROAD CLOSED AHEAD" sign. You put it up months before closure. You monitor if people are still using the road. When closure happens, you remove the signs (deprecation header) and the road (endpoint).

## Internal Mechanics
- Deprecation registry: a database or config file tracking all deprecated versions with `deprecation_date`, `sunset_date`, `removal_date`, `migration_url`.
- A scheduled command checks if a version's `deprecation_date` has passed and adds the deprecation header automatically.
- Consumer traffic analysis identifies which API keys are hitting deprecated endpoints.
- When traffic to a deprecated version drops below a threshold, automated outreach triggers.

## Patterns
- Deprecation registry with lifecycle statuses: `ACTIVE`, `DEPRECATED`, `SUNSET`, `REMOVED`.
- Automated deprecation header injection based on registry dates.
- Consumer notification queue: when a consumer hits a deprecated endpoint, log for potential outreach.
- Deprecation dashboard showing adoption curves and migration progress.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Deprecation trigger | Date-based automatic | Consistent, predictable |
| Consumer notification | Email for high-traffic consumers | Proactive migration support |
| Deprecation removal | With version retirement | Clean end state |
| Registry storage | Database with admin UI | Manageable at scale |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Automatic deprecation | No missed deprecations | Inflexible for special cases |
| Manual deprecation | Human judgment | Can be forgotten |
| Outbound notification | Proactive | May be ignored |
| Passive (header only) | Low effort | Consumers may miss it |

## Performance Considerations
- Deprecation registry is checked per-request; cache it to avoid database hits.
- Consumer traffic analysis runs on log data, not live traffic.
- Notification system is asynchronous (queue job).

## Production Considerations
- Never deprecate a version on a Friday or holiday.
- Monitor support ticket volume after deprecation announcements.
- Deprecation is a two-way conversation: consumers may have migration blockers you need to address.
- When a deprecated version has zero traffic for 30+ days, proceed to sunset.

## Common Mistakes
- Setting a deprecation date but no sunset date (consumers don't know when to migrate by).
- Deprecating a version that still has active SLA commitments.
- Not testing that deprecated versions still work correctly.
- Removing a deprecation header early because "nobody uses it" — someone may still be using it.

## Failure Modes
- **Perpetual deprecation:** Version deprecated for years with no removal date — consumers ignore the warning.
- **Early removal:** Version removed while consumers still rely on it, causing production incidents.
- **Unnoticed deprecation:** Consumer's monitoring system strips headers, they never see the deprecation.
- **Deprecation without alternative:** Version deprecated but no upgrade path exists.

## Ecosystem Usage
- **Stripe:** Deprecation header appears 12+ months before sunset. Email notification sent to affected account holders.
- **Twilio:** 12-month deprecation window with automated reminders at 6 months, 3 months, 1 month.
- **GitHub:** Deprecation headers on preview API features with published deprecation timeline.

## Related Knowledge Units
- **Prerequisites:** Consumer notification systems, SLA management
- **Related Topics:** Sunset header implementation, Phased deprecation timeline
- **Advanced Follow-up:** RFC 9745 compliance, Deprecation automation frameworks

## Research Notes
### Source Analysis
RFC 9745 (E. Wilde, 2022) is the authoritative reference. Twilio's public deprecation timeline (2023) demonstrates best-practice consumer communication.

### Key Insight
The deprecation header is the START of a conversation, not the end. It must be followed by sunset headers, migration guides, consumer outreach, and eventual retirement. A deprecation without a plan is noise.

### Version-Specific Notes
Laravel 11 middleware supports conditionally adding headers. Use `$response->header()` in a `terminate` middleware for post-response header injection.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization