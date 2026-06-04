# ECC Standardized Knowledge — Sunset Header Implementation

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Sunset Header Implementation |
| Difficulty | Intermediate |
| Category | Implementation |
| Last Updated | 2026-06-02 |

## Overview

The `Sunset` header (RFC 8594) announces when an API version or endpoint will be removed. This KU covers implementing the `Sunset` header alongside the `Deprecation` header, configuring sunset dates, and providing migration timelines. The Sunset header is only useful if the date is actually enforced — a sunset date that passes without consequence trains consumers to ignore deadlines. It contains an HTTP-date value (`Sunset: Sat, 31 Dec 2026 23:59:59 GMT`) and should always be paired with a `Deprecation` header.

## Core Concepts

- **`Sunset` Header**: `Sunset: Sat, 31 Dec 2026 23:59:59 GMT` — removal deadline
- **RFC 8594**: Standardizes the `Sunset` HTTP header with HTTP-date value
- **Deprecation + Sunset Pair**: Deprecation warns, Sunset sets the deadline
- **HTTP-date format**: RFC 7231 format — `gmdate('D, d M Y H:i:s \G\M\T', ...)`
- **Enforcement**: 410 Gone on/after the sunset date
- **Grace Period**: 30-day buffer between last deprecation header and sunset enforcement

## When To Use

- When an API version has a defined removal date
- After the Deprecation header has been active for a sufficient period (6+ months)
- As part of the phased deprecation timeline (Warn/Enforce phases)
- Before any version removal to set consumer expectations

## When NOT To Use

- Without a preceding `Deprecation` header (surprise removal)
- When the removal date is uncertain or likely to be extended
- For versions that are still actively accepting new consumers

## Best Practices

- **Always pair with a `Deprecation` header** — never use Sunset alone.
- **Set sunset dates at least 6 months after deprecation announcement**.
- **Use HTTP-date format** (RFC 7231) via Carbon: `Carbon::create(2026, 12, 31)->toRfc7231String()`.
- **Store sunset dates in config** for easy updates without code changes.
- **Test that 410 response after sunset includes helpful migration message**.
- **Automate sunset enforcement** — scheduled command returns 410 on/after the date.
- **Never extend a sunset date unless absolutely necessary** — it erodes consumer trust.

## Architecture Guidelines

- Sunset header injection adds ~0.01ms — negligible.
- Config lookup is cached, O(1) — no performance concern.
- Scheduled sunset enforcement runs daily — negligible overhead.
- Post-sunset 410 responses are cacheable (`Cache-Control: public, max-age=86400`).
- The sunset date is a promise to your consumers — extend only when the cost of breaking consumers exceeds the cost of maintaining the old version.

## Performance Considerations

- Sunset header injection adds ~0.01ms per response.
- Config lookup is cached, O(1).
- Post-sunset 410 responses are cacheable — reduce repeated processing.
- Scheduled sunset enforcement runs daily — negligible overhead.

## Security Considerations

- After sunset, the version must return 410 and not serve any data — including cached auth tokens.
- Ensure sunset enforcement doesn't introduce bypass vulnerabilities (e.g., version header overriding sunset logic).
- Timezone confusion: all sunset dates should be UTC to avoid consumer confusion across timezones.

## Common Mistakes

- Setting a `Sunset` header without a `Deprecation` header (surprise removal).
- Using `Sunset: true` instead of a proper date.
- Forgetting to update the sunset date when extending the timeline.
- Not having a 410 response ready for after the sunset date.

## Anti-Patterns

- **Missed sunset**: Sunset date passes but version still works — consumers learn to ignore deadlines.
- **Premature 410**: Bug triggers 410 before sunset date — consumer panic.
- **Perpetual sunset**: Version with a Sunset header that never actually gets removed.

## Examples

```php
// Sunset middleware
class SunsetMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $version = $request->attributes->get('api_version');
        $sunsetDates = config('api.sunset', []);

        if (isset($sunsetDates[$version])) {
            $sunsetDate = Carbon::parse($sunsetDates[$version]);

            if (now()->greaterThanOrEqualTo($sunsetDate)) {
                abort(410, "API version {$version} has been removed. Please migrate to the latest version.");
            }

            $response->header('Sunset', $sunsetDate->toRfc7231String());
        }

        return $response;
    }
}

// Scheduled command for sunset enforcement
$schedule->command('api:enforce-sunset')->daily();
```

## Related Topics

- **Prerequisites**: rest-api-design, crud-architecture, resource-controllers
- **Siblings**: deprecation-header-implementation, phased-deprecation-timeline
- **Advanced**: RFC 8594, Sunset enforcement automation

## AI Agent Notes

- The Sunset header is only useful if the date is actually enforced. A sunset date that passes without consequence trains consumers to ignore deadlines.
- RFC 8594 (2019) is the authoritative specification. Stripe's implementation was among the first major adoptions.
- Laravel 11's `Carbon::create(2026, 12, 31)->toRfc7231String()` generates the correct HTTP-date format.

## Verification

- [ ] `Sunset` header present on all deprecated responses with HTTP-date format
- [ ] Paired with `Deprecation` header on all deprecated responses
- [ ] Sunset dates are at least 6 months after deprecation
- [ ] Automated sunset enforcement returns 410 on/after the sunset date
- [ ] 410 response includes migration message and link to alternative
- [ ] Post-sunset 410 responses are cacheable
- [ ] Sunset dates stored in config, not hardcoded
