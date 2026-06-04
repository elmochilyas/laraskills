# Deprecation Notes in Docs

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Documentation
- **Knowledge Unit:** Deprecation Notes in Docs
- **Last Updated:** 2026-06-02

---

## Executive Summary

Deprecation notes in documentation communicate that an endpoint, parameter, response field, or API version is scheduled for removal. Proper deprecation documentation gives consumers advance notice, migration guidance, and a clear timeline for removal — preventing integration breaks and reducing support burden.

In OpenAPI, deprecation is indicated by the `deprecated: true` flag on operations and schema properties. Documentation tools (Swagger UI, ReDoc) render deprecated items with visual styling (strikethrough, warning badges, muted colors). Beyond the OpenAPI flag, deprecation notes should include: what is being deprecated, what replaces it, the removal timeline, and migration instructions.

---

## Core Concepts

### Deprecation Levels
- **Soft deprecation** — Still recommended against; no removal date set
- **Hard deprecation** — Removal date set; actively discourage new use
- **Sunset** — No longer functional; removed from the API

### OpenAPI Deprecation Flag
Mark endpoints as deprecated in the spec:
```yaml
paths:
  /users/list:
    get:
      deprecated: true
      summary: List users (deprecated)
      description: |
        Deprecated. Use GET /users instead.
        Removal date: 2026-12-31
```

Mark schema properties as deprecated:
```yaml
components:
  schemas:
    User:
      properties:
        full_name:
          type: string
          deprecated: true
          description: Deprecated. Use first_name and last_name instead.
```

### Deprecation Headers
API responses should include deprecation headers:
- `Deprecation: true` — Indicates the API version or endpoint is deprecated
- `Sunset: Sat, 31 Dec 2026 23:59:59 GMT` — Indicates when the deprecated feature will be removed
- `Link: <https://docs.example.com/migration>; rel="deprecation"` — Link to migration guide

---

## Mental Models

### Deprecation as Communication
Deprecation is a communication channel between API provider and consumer. The deprecation note answers: "What is changing? When? What should I use instead? How do I migrate?"

### Timeline Visibility
The most important piece of deprecation information is the timeline. Consumers need to know: when was deprecation announced, when will removal happen, and how much time remains.

### Deprecation in OpenAPI
The `deprecated` flag is binary — something is either deprecated or not. Additional context (timeline, replacement, migration) must be provided in the description field.

---

## Internal Mechanics

### OpenAPI Operation Deprecation
```yaml
/users/list:
  get:
    deprecated: true
    summary: List users (deprecated)
    description: |
      > **Deprecated:** This endpoint is deprecated.
      > **Use instead:** `GET /users`
      > **Deprecated since:** v2.1.0 (2026-03-15)
      > **Removal date:** v3.0.0 (2026-12-31)
      > **Migration:** Replace `/users/list` with `/users`. The response
      > format is identical. No other changes required.
```

### OpenAPI Schema Property Deprecation
```yaml
User:
  properties:
    name:
      type: string
      deprecated: true
      description: Deprecated. Use full_name instead.
    full_name:
      type: string
```

### Scramble Deprecation Handling
Scramble reads PHP 8.4 `#[Deprecated]` attribute or `@deprecated` PHPDoc tag on controller methods and maps them to `deprecated: true` in the generated OpenAPI spec.

### Scribe Deprecation Handling
Scribe supports `@deprecated` in controller method doc blocks. The annotation is passed through to the generated documentation.

### Sunset Header Implementation
Laravel middleware to add deprecation headers:
```php
public function handle(Request $request, Closure $next): Response
{
    $response = $next($request);
    $response->header('Deprecation', 'true');
    $response->header('Sunset', 'Sat, 31 Dec 2026 23:59:59 GMT');
    $response->header('Link', '<https://docs.example.com/migration>; rel="deprecation"');
    return $response;
}
```

---

## Patterns

### Standard Deprecation Notice Format
Every deprecation notice should include:
1. What is being deprecated (endpoint, field, version)
2. What replaces it (alternative endpoint, field, version)
3. When it was deprecated (version + date)
4. When it will be removed (version + date)
5. Migration instructions (step-by-step)

### Deprecation Callout in Descriptions
Use a consistent callout format:
```
> **Deprecated:** [What]
> **Use instead:** [Alternative]
> **Deprecated since:** [Version] ([Date])
> **Removal date:** [Version] ([Date])
> **Migration:** [Steps]
```

### Deprecation in Changelog
Every deprecation should appear in the changelog under a "Deprecated" section with the same details.

### Soft vs Hard Deprecation Distinction
Use different visual treatments:
- Soft: "Deprecated" badge, no date
- Hard: "Deprecated" badge with removal date
- Sunset: "Removed" badge, endpoint returns 410

---

## Architectural Decisions

### Deprecation Notice Granularity
Should deprecation be at the operation level, field level, or API version level? Decision: Deprecate at the finest granularity that makes sense. A deprecated endpoint marks the whole operation; a deprecated field marks only that property.

### Inline vs Referenced Deprecation
Deprecation notes can be written inline in each operation description or centralized in a deprecation policy document. Decision: Inline for simple deprecations; reference a migration guide for complex deprecations.

### Automated Deprecation Headers
Add `Deprecation` and `Sunset` headers to API responses for deprecated endpoints. These headers enable automated consumer tooling to detect and report deprecation usage.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clear deprecation prevents consumer breaks | Deprecation notes add spec verbosity | Use consistent, brief format |
| Deprecation headers enable automation | Requires middleware to maintain | Automate header injection by version |
| Granular deprecation (field-level) is precise | More deprecation notes to maintain | Deprecate at operation level when possible |
| Migration guidance reduces support tickets | Migration instructions must be maintained | Include link to migration guide, not full text |

---

## Performance Considerations

### N/A
Deprecation notes have no runtime performance impact. Deprecation response headers add minimal overhead.

---

## Production Considerations

### Deprecation Monitoring
Track which consumers are using deprecated features. Use the deprecation headers to log usage and contact consumers before removal:

```php
Log::info('Deprecated endpoint used', [
    'endpoint' => $request->path(),
    'consumer' => auth()->user()?->id,
    'user-agent' => $request->userAgent(),
]);
```

### Deprecation Timeline Enforcement
Enforce the deprecation timeline:
1. Announce deprecation (changelog + endpoint docs)
2. Add deprecation headers after announcement
3. Return 410 Gone after removal date
4. Keep documentation as historical reference

### Communication to Consumers
Notify affected consumers directly (email, dashboard message) for breaking deprecations. Automated changelog feeds and deprecation headers serve as passive notification.

---

## Common Mistakes

### No Replacement Indicated
Why it happens: Deprecation is noted but the alternative is not. Why it's harmful: Consumers know something is changing but not what to use instead. Better approach: Always include "Use instead" in deprecation notices.

### Vague Timeline
Why it happens: "Will be removed in a future version." Why it's harmful: Consumers cannot plan migration. Better approach: Specify the exact version and date.

### No Migration Instructions
Why it happens: Migration seems obvious to the API developer. Why it's harmful: Consumers waste time reverse-engineering the migration. Better approach: Provide step-by-step migration instructions, even for "simple" changes.

### Forgetting to Remove After Sunset
Why it happens: Sunset date passes but the endpoint still works. Why it's harmful: Consumers have no incentive to migrate. Better approach: Enforce the sunset date; return 410 Gone.

---

## Failure Modes

### Deprecated Without Consumer Notification
An endpoint is marked deprecated in docs but consumers are not notified. Failure mode: Consumers discover deprecation after removal. Mitigation: Use deprecation headers and email notifications.

### Premature Removal
An endpoint is removed before the stated sunset date. Failure mode: Consumers relying on the timeline break unexpectedly. Mitigation: Never remove before the stated date; extend if needed.

### Deprecated but No Replacement
An endpoint is deprecated with no alternative. Failure mode: Consumers have no migration path. Mitigation: Only deprecate when a replacement exists.

---

## Ecosystem Usage

### Stripe Deprecation
Stripe announces deprecations in their changelog, marks deprecated fields in API responses with deprecation headers, and provides migration guides. Deprecated features have clear removal dates.

### GitHub API Deprecation
GitHub marks deprecated endpoints with preview notices, maintains a deprecation timeline in documentation, and sends notifications to affected integrations.

### Twilio Deprecation
Twilio maintains a deprecation calendar, provides migration guides for deprecated features, and communicates deprecations via email and changelog.

---

## Related Knowledge Units

### Prerequisites
- API Versioning Strategy — Version lifecycle and deprecation policy
- API Changelog Generation — Where deprecations are announced

### Related Topics
- API Version Documentation — Version-level deprecation
- Changelog Generation — Deprecation entries in changelog
- Documentation CI Validation — Deprecation documentation checks

### Advanced Follow-up Topics
- Deprecation Suntec Header Implementation — Technical implementation of deprecation headers
- Consumer Deprecation Notification — Automated consumer notification pipeline
- Deprecation Policy Design — Organizational deprecation standards

---

## Research Notes

### Source Analysis
- IETF Draft: Deprecation HTTP Header — https://datatracker.ietf.org/doc/draft-ietf-httpapi-deprecation-header/
- RFC 8594: Sunset HTTP Header — Standard for indicating API feature removal dates

### Key Insight
Deprecation documentation is most effective when combined with deprecation response headers. The documentation tells consumers what is changing; the headers tell them when they are using something deprecated.

### Version-Specific Notes
- OpenAPI 3.1: `deprecated` on both operation and schema property levels
- OpenAPI 3.0: `deprecated` on operation level only (not schema properties)
- Laravel 11: No built-in deprecation header support; custom middleware required
