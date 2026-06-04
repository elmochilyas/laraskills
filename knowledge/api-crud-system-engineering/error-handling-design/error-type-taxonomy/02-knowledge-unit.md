# Error Type Taxonomy

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
A structured classification system that categorises all application errors into three top-level buckets — operational, programmer, and infrastructure — so that handling strategies, monitoring rules, and recovery actions can be applied automatically based on type rather than ad-hoc inspection.

## Core Concepts
- **Operational Errors**: Expected runtime failures (validation, auth, not found, conflict, rate limit). The system can recover without a deploy.
- **Programmer Errors**: Bugs (null pointer, type mismatch, unhandled edge cases). Require code changes.
- **Infrastructure Errors**: External service failures (database down, queue timeout, disk full). Require ops intervention or retry.
- **Expected vs Unexpected**: Operational = expected; Programmer + Infrastructure = unexpected.
- **Recoverability**: Determines whether a request can be retried safely.

## Mental Models
| Category | Metaphor | Recovery |
|---|---|---|
| Operational | Traffic jam | Reroute or inform user |
| Programmer | Wrong turn in code | Fix the map (deploy) |
| Infrastructure | Bridge collapsed | Wait for repair |

## Internal Mechanics
Error classification happens at the boundary layer (controllers, middleware, listeners). Each thrown exception is classified by its base type and mapped into the appropriate taxonomic bucket. Classification rules are defined once in the exception handler and never duplicated.

```php
enum ErrorCategory: string
{
    case Operational = 'operational';
    case Programmer  = 'programmer';
    case Infrastructure = 'infrastructure';
}
```

## Patterns
- **Classification by Base Type**: Extend `OperationalException`, `ProgrammerException`, `InfrastructureException` base classes.
- **Type-Specific Handlers**: Register custom `render()` per base type.
- **Retry Policies**: Only operational and infrastructure errors qualify for retry; programmer errors never do.
- **Alert Routing**: Operational → low-priority dashboard; Programmer → on-call engineer; Infrastructure → ops channel.

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Number of top categories | 3 | Keeps taxonomy simple; avoids over-classification |
| Classification timing | At exception handler | Single point; no spread of classification logic |
| Enum vs interface | Enum (backed by string) | Easy to persist, log, and filter |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Granularity | 3 categories simple, but may lose nuance | 10+ categories precise, but complex to maintain | 3 categories; sub-classify within operational |
| Classification location | At source (throw site) | At handler | Handler — keeps throw sites clean |
| Strict typing | Enforce via abstract base classes | Convention-only | Base classes — compiler-enforced |

## Performance Considerations
- Classification is O(1) — a single `instanceof` check.
- No measurable overhead at exception-handler scale.
- Avoid reflection-based classification in hot paths.

## Production Considerations
- Log the category tag in every error log line for dashboard filtering.
- Set PagerDuty alert rules by category.
- Exclude programmer error details in production (they leak internals).

## Common Mistakes
- Classifying programmer errors as operational to "avoid alerts" — hides bugs.
- Forgetting to classify third-party library exceptions; they land in a default "unknown" bucket.
- Putting infrastructure errors in the same category as operational (different recovery semantics).

## Failure Modes
- **Misclassification**: An operational error classified as programmer causes unnecessary deploys.
- **Unclassified Errors**: Fall through to a generic handler with no automated recovery — add a CI lint rule to require classification.
- **Category Drift**: Over time errors change nature (e.g., transient becomes permanent); review taxonomy quarterly.

## Ecosystem Usage
- **Laravel**: `Handler` class uses `$this->renderable()` with `instanceof` checks.
- **Sentry**: Tags allow grouping by `error_category` for dashboard filters.
- **OpenAPI**: The taxonomy can be expressed as a discriminator in the error schema.

## Related Knowledge Units
### Prerequisites
- KU-02 Standardized Error Envelope
- KU-13 Custom Exception Classes

### Related Topics
- Incident severity classification (P0–P4 mirrors operational vs programmer)

### Advanced Follow-up Topics
- Chaos engineering — verifying taxonomy via fault injection (Phase 4)

## Research Notes
### Source Analysis
Derived from Martin Fowler's "Error Taxonomy" patterns and Microsoft's "Exception Handling Best Practices". The 3-bucket model is used by Stripe, Twilio, and AWS SDKs.

### Key Insight
The most important rule: **never mix programmer errors into operational handling**. Once a programmer error is silenced by a catch-all, it becomes invisible and never gets fixed.

### Version-Specific Notes
- Laravel 10+ supports `report()` / `shouldReport()` for per-type suppression.
- PHP 8.1+ enum-backed categories allow direct serialization into JSON responses.
