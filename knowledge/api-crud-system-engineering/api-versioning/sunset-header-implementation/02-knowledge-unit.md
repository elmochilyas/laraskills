# Sunset Header Implementation — Phase 2: Implementation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
The `Sunset` header (RFC 8594) announces when an API version or endpoint will be removed. Phase 2 covers implementing the `Sunset` header alongside the `Deprecation` header, configuring sunset dates, and providing migration timelines.

## Core Concepts
- **Sunset Header:** `Sunset: Sat, 31 Dec 2026 23:59:59 GMT` — tells consumers when support ends.
- **RFC 8594:** Standardizes the `Sunset` HTTP header with an HTTP-date value.
- **Sunset + Deprecation Pair:** Deprecation warns, Sunset sets the deadline.
- **Sunset Date Precision:** Typically a date (no time) for API versions; datetime for specific features.

## Mental Models
- **Moving Truck Date:** The Sunset header is the moving truck arrival date. "Your data (endpoint) will be moved (removed) on December 31st. Be out by then."
- **Store Closing Date:** A store announces "Closing Dec 31" (Sunset). Before that, they have a "Going out of business" sign (Deprecation). After Dec 31, the store is gone (410).

## Internal Mechanics
- Middleware reads the sunset date from config for the resolved version.
- `header('Sunset: Sat, 31 Dec 2026 23:59:59 GMT')` added to every response from the version.
- Sunset date must be a valid HTTP-date (RFC 7231) format.
- Sunset middleware runs only on deprecated versions (paired with deprecation middleware).

## Patterns
- Sunset config: `config('api.sunset.v1')` with date string.
- Sunset + Deprecation middleware applied to deprecated route groups.
- Sunset date in response body as `sunset` field for consumer visibility.
- Grace period: 30-day buffer between last deprecation header and Sunset enforcement.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Date format | HTTP-date (RFC 7231) | RFC 8594 requirement |
| Date source | Config file | Easy to update without code changes |
| Midnight choice | 23:59:59 UTC | End of day, predictable |
| Enforcement | 410 on/after sunset | Clear signal, no ambiguity |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| HTTP-date format | Standards-compliant | Less human-readable than ISO 8601 |
| Config-based date | No deploy for date changes | Config drift risk |
| Strict enforcement | Clear expectations | No forgiveness |
| Grace period | Consumer-friendly | Extends support burden |

## Performance Considerations
- Sunset header injection adds ~0.01ms.
- Config lookup is cached, O(1).
- No performance impact from the Sunset header itself.

## Production Considerations
- Sunset dates should be at least 6 months after the deprecation announcement.
- Never extend a sunset date unless absolutely necessary — it erodes trust.
- Test that the 410 response after sunset includes a helpful migration message.
- Include the sunset date in API documentation prominently.

## Common Mistakes
- Setting a Sunset header without a Deprecation header (surprise removal).
- Using `Sunset: true` instead of a proper date.
- Forgetting to update the sunset date when extending the timeline.
- Not having a 410 response ready for after the sunset date.

## Failure Modes
- **Missed sunset:** Sunset date passes but version still works — consumers get false expectation.
- **Premature 410:** Bug triggers 410 before sunset date, consumer panic.
- **Timezone confusion:** Sunset date in server timezone vs UTC — consumers in different timezones affected differently.
- **Forgotten extension:** Sunset extended but config not updated, version prematurely removed.

## Ecosystem Usage
- **Stripe:** `Sunset` header on deprecated API versions with 12+ months notice.
- **Twilio:** `Sunset` header on deprecated endpoints with 12-month advance notice.
- **GitHub:** `Sunset` header on preview API features with published removal dates.

## Related Knowledge Units

### Prerequisites
- rest-api-design
- crud-architecture
- resource-controllers

### Related Topics
- Deprecation header implementation
- Phased deprecation timeline

### Advanced Follow-up Topics
- RFC 8594
- Sunset enforcement automation

## Research Notes
### Source Analysis
RFC 8594 (E. Wilde, 2019) is the authoritative specification. Stripe's implementation (2020) was the first major adoption of the Sunset header standard.

### Key Insight
The Sunset header is only useful if the date is actually enforced. A sunset date that passes without consequence trains consumers to ignore your deadlines.

### Version-Specific Notes
HTTP-date format in PHP: `gmdate('D, d M Y H:i:s \G\M\T', strtotime('2026-12-31'))`. Laravel 11's `Carbon` can format directly.
