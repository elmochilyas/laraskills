# ECC Standardized Knowledge — Versioning Strategy Selection

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Versioning Strategy Selection |
| Difficulty | Advanced |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

Selecting the right versioning strategy is a foundational architectural decision. This KU provides a decision framework, comparison matrix, and implementation plan for choosing between URL path, header-based, and media-type versioning approaches based on project context. Key selection dimensions include visibility, cacheability, REST purity, client complexity, and tooling support. The context fit varies for internal vs public APIs, web vs mobile, and browser vs server clients. Hybrid approaches (URL for major versions, header for minor/patch) are possible but require clear boundaries.

## Core Concepts

- **URL Path Versioning**: Version in URI (`/api/v1/users`) — simple, visible, cacheable
- **Header-Based Versioning**: Version in `Accept` or custom header — REST-pure, hidden
- **Media-Type Versioning**: Version in vendor MIME type (`application/vnd.myapp.v1+json`) — most RESTful
- **Selection Dimensions**: Visibility, cacheability, REST purity, client complexity, tooling support
- **ADR Requirement**: Architecture Decision Record documenting the chosen strategy and rationale

## When To Use

- At project inception before any endpoints are built
- When evaluating tradeoffs between URL, header, and media-type approaches
- As part of API style guide definition
- When the team needs alignment on versioning approach

## When NOT To Use

- After endpoints are already deployed with a strategy (switching is expensive)
- For trivial/internal APIs where simple URL versioning is obviously sufficient
- When the decision analysis delays shipping (analysis paralysis)

## Best Practices

- **Use a decision matrix** with weighted criteria scored against each strategy.
- **Document the decision as an ADR** with rationale, examples, and migration path.
- **Prototype the simplest endpoint** in all three strategies, compare.
- **Choose based on consumer ease**, not architectural purity — the best strategy is the one your consumers find easiest to use.
- **Match API type to strategy**: URL for public APIs, header for internal microservices.

## Architecture Guidelines

- Switching strategies later is expensive; choose early and document.
- Hybrid approaches must have clear boundaries (e.g., URL for major, header for minor).
- URL path versioning is the most commonly expected for public APIs.
- Header versioning reduces URL churn for internal services.
- Media-type versioning is the choice for APIs supporting multiple serialization formats per version.

## Performance Considerations

- All three strategies have negligible performance differences (~0.05-0.15ms per request).
- The main performance driver is the number of versions, not the strategy choice.
- URL versioning requires no `Vary` header, reducing CDN complexity.

## Security Considerations

- URL versioning makes version obvious in logs — easier to detect deprecated version abuse.
- Header versioning can hide the version from security monitoring tools that only inspect URLs.
- Ensure version parsing middleware doesn't introduce injection vulnerabilities.

## Common Mistakes

- Choosing header versioning because it's "cleaner" without considering consumers who can't easily change headers (mobile apps).
- Over-engineering: using media-type versioning for a 3-endpoint internal service.
- Not documenting the strategy decision, leading to inconsistent application across the team.
- Switching strategies mid-lifecycle without a migration plan.

## Anti-Patterns

- **Strategy mismatch**: URL versioning chosen for a CDN-heavy API, causing cache purge complexity.
- **No ADR**: Team mixes URL and header versioning across endpoints — no standard.
- **Analysis paralysis**: Spending months debating the "perfect" strategy instead of shipping.

## Examples

```php
// Decision matrix scoring (simplified)
$strategies = [
    'url' => ['visibility' => 10, 'cacheability' => 9, 'rest_purity' => 3, 'client_effort' => 9],
    'header' => ['visibility' => 4, 'cacheability' => 6, 'rest_purity' => 7, 'client_effort' => 6],
    'media_type' => ['visibility' => 3, 'cacheability' => 6, 'rest_purity' => 10, 'client_effort' => 3],
];
```

## Related Topics

- **Prerequisites**: rest-api-design, crud-architecture, resource-controllers
- **Siblings**: url-path-versioning, header-based-versioning, media-type-versioning
- **Advanced**: Multi-strategy evolution, API gateway version routing

## AI Agent Notes

- There is no universally "best" versioning strategy. The best strategy is the one your consumers find easiest to use.
- Laravel is agnostic to versioning strategy — all three can be implemented with standard HTTP kernel features.
- Document the chosen strategy in the API style guide and enforce it via architecture tests.

## Verification

- [ ] Decision matrix completed with weighted criteria
- [ ] ADR written documenting chosen strategy with rationale
- [ ] Prototype implemented in chosen strategy
- [ ] Strategy documented in API style guide
- [ ] Team trained on the chosen approach
