# Error Type Taxonomy

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-error-type-taxonomy |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Intermediate |
| Classification | Conceptual / Foundational |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

A structured classification system that categorises all application errors into three top-level buckets — operational, programmer, and infrastructure — enabling automated handling strategies, monitoring rules, and recovery actions based on type rather than ad-hoc inspection.

## Core Concepts

- **Operational Errors**: Expected runtime failures (validation, auth, not found, conflict, rate limit). The system can recover without a deploy.
- **Programmer Errors**: Bugs (null pointer, type mismatch, unhandled edge cases). Require code changes to fix.
- **Infrastructure Errors**: External service failures (database down, queue timeout, disk full). Require ops intervention or retry.
- **Expected vs Unexpected**: Operational errors are expected; programmer and infrastructure errors are unexpected.
- **Recoverability**: Determines whether a request can be retried safely and what recovery action is appropriate.
- **Classification by Base Type**: Extend `OperationalException`, `ProgrammerException`, or `InfrastructureException` base classes.
- **Type-Specific Handlers**: Register custom `render()` per base type in the global exception handler.
- **Retry Policies**: Only operational and infrastructure errors qualify for retry; programmer errors never do.
- **Alert Routing**: Operational → low-priority dashboard; Programmer → on-call engineer; Infrastructure → ops channel.

## When To Use

- When designing a new API that needs consistent, automated error handling
- When multiple teams contribute to the same codebase and need a shared error vocabulary
- When integrating with error tracking services that need error category filtering
- When setting up incident severity levels that map to error categories
- When implementing automated recovery or retry logic

## When NOT To Use

- For trivial applications with a single developer and no external consumers
- When the error handling system already exists and retraining the taxonomy is disruptive
- In prototypes or MVPs where speed of delivery outweighs architectural rigor
- When the team is not committed to maintaining the classification over time

## Best Practices (WHY)

- **Use three categories only**: Keeps taxonomy simple and avoids over-classification. Operational gets sub-types for more nuance when needed.
- **Classify at the handler, not at the throw site**: Single point of classification; throw sites stay clean.
- **Use abstract base classes over enums for hierarchy**: Compiler-enforced classification; cannot accidentally omit.
- **Never mix programmer errors into operational handling**: Once silenced by a catch-all, bugs become invisible and never get fixed.
- **Tag every log line with category**: Enables dashboard filtering and alert routing.
- **Review taxonomy quarterly**: Errors change nature over time (e.g., transient becomes permanent).
- **Add CI rule to require classification**: Prevents unclassified exceptions from reaching production.

## Architecture Guidelines

- Define three abstract base classes: `OperationalException`, `ProgrammerException`, `InfrastructureException`, all extending `ApiException`.
- Use a backed enum `ErrorCategory: string` for serialization and logging.
- Register category-specific render callbacks in `App\Exceptions\Handler::register()`.
- Map third-party library exceptions into the taxonomy explicitly — never let them land in an "unknown" bucket.
- Keep classification logic in a single `classify(Throwable): ErrorCategory` method.
- Store the category tag in every error log line for dashboard aggregation.

## Performance Considerations

- Classification is O(1) — a single `instanceof` check per base type.
- No measurable overhead at exception-handler scale (exceptions are not on the hot path).
- Avoid reflection-based classification; use explicit type checks.
- Pre-compile the classification map at boot time for maximum speed.

## Security Considerations

- Never expose the error category to API clients — it reveals internal system knowledge.
- Programmer error details (file paths, stack traces) must never appear in production responses.
- Infrastructure error messages can leak topology (e.g., "Redis connection failed" reveals caching infrastructure).
- Log category internally for debugging but strip from all external responses.
- Ensure third-party package exceptions are classified and sanitised.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Classifying programmer errors as operational | Marking bugs as expected errors | Desire to avoid PagerDuty alerts | Bugs become invisible and never get fixed | Always classify accurately; use lower alert severity if needed |
| No classification for third-party exceptions | Library exceptions fall through unmapped | Assuming packages handle their own errors | Silent failures with no recovery action | Map every third-party exception explicitly in the handler |
| Mixing infrastructure with operational | Treating DB failures as normal operational errors | Similar retry semantics | Wrong alert routing and escalation paths | Keep separate categories; they have different recovery owners |
| Over-classification | Creating 10+ subcategories | Desire for precision | Taxonomy becomes unmaintainable | Start with 3; sub-classify within operational only when needed |

## Anti-Patterns

- **Single catch-all category**: Every error gets the same treatment; no differentiated response.
- **Classification by HTTP status code**: 500 can be operational or programmer; status alone is insufficient.
- **Taxonomy in configuration files**: Classification logic scattered across configs becomes unmaintainable.
- **No default classification**: Unmapped exceptions fall to a black hole with no handling.
- **Dynamic classification via reflection**: Slow, fragile, and obscures the taxonomy structure.

## Examples

```php
enum ErrorCategory: string
{
    case Operational = 'operational';
    case Programmer  = 'programmer';
    case Infrastructure = 'infrastructure';
}

abstract class ApiException extends \RuntimeException
{
    abstract public function getCategory(): ErrorCategory;
}

class OperationalException extends ApiException
{
    final public function getCategory(): ErrorCategory
    {
        return ErrorCategory::Operational;
    }
}
```

## Related Topics

- Standardized Error Envelope (carries the categorized error)
- Custom Exception Classes (makes taxonomy concrete)
- Global Exception Handler Config (where classification is applied)
- Incident severity classification (P0–P4 mirrors operational vs programmer)
- Chaos engineering — verifying taxonomy via fault injection

## AI Agent Notes

- When generating new exception classes, always extend the appropriate category base class.
- Validate that new exception classes have corresponding renderable callbacks in the handler.
- Never auto-classify exceptions based on namespace or naming conventions alone — require explicit inheritance.
- When refactoring, ensure exception category checks use `instanceof`, not string matching on class names.

## Verification

- [ ] All custom exception classes extend one of the three category base classes
- [ ] The handler contains a `classify()` method that returns `ErrorCategory` for any `Throwable`
- [ ] Every log line for errors includes the `error_category` tag
- [ ] CI contains a lint rule that fails if any `Throwable` is not classified
- [ ] Third-party package exceptions are explicitly mapped in the handler
- [ ] No programmer errors are silenced by being classified as operational
- [ ] Taxonomy is reviewed at least quarterly and updated as error patterns evolve
