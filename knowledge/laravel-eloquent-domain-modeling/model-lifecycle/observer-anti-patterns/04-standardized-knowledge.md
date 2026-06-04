# Observer Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Observer Anti-Patterns |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Observers can become problematic when overused or misused. Common issues include non-local side effects, infinite loops, performance bottlenecks, and hidden business logic. This KU identifies observer anti-patterns and provides solutions.

## Anti-Patterns

### 1. Business Logic in Observers
**Problem**: Putting business rules and domain logic in observers instead of model methods or domain services.
**Cause**: Convenience — an observer is always "right there" when a model is saved.
**Consequence**: Business logic is scattered across observers, making it hard to test, debug, and reason about.
**Solution**: Keep observers for infrastructure concerns (cache, logs). Business logic belongs in model methods or domain services.

### 2. Observer as God Class
**Problem**: A single observer handling all side effects for a model (cache, audit, notifications, sync, billing).
**Cause**: Initial simplicity — "just one file."
**Consequence**: The observer becomes hard to test, understand, and change. One side effect change risks breaking another.
**Solution**: One observer per concern: `CacheObserver`, `AuditObserver`, `NotificationObserver`.

### 3. Heavy Operations in Sync Observers
**Problem**: Making HTTP calls, processing images, or sending emails synchronously in observer methods.
**Cause**: Convenience — it works in development with small datasets.
**Consequence**: Slow model operations, timeouts in production, blocked queue workers.
**Solution**: Dispatch a job for expensive operations. Keep observer methods fast.

### 4. Infinite Event Loops
**Problem**: An observer saves a model, which triggers the same observer again.
**Cause**: Saving the observed model inside its own observer.
**Consequence**: Stack overflow or maximum execution time exceeded.
**Solution**: Use `saveQuietly()` or `withoutEvents()` for model saves inside observers.

### 5. Hidden Dependencies
**Problem**: Observers call services, repositories, or facades as global dependencies.
**Cause**: Convenience — no constructor injection in observer classes.
**Consequence**: Hard to test, hidden coupling, difficult to mock.
**Solution**: Use constructor injection in observer classes.

## Best Practices

- **Observers for infrastructure, not business logic**: Cache, logs, sync — not business rules.
- **One observer per concern**: Keep observers focused on a single cross-cutting concern.
- **Dispatch jobs for heavy operations**: Observers should be fast (<5ms).
- **Use constructor injection**: Avoid facades and globals in observers.

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Observer Pattern |
| Closely Related | Observer Registration |
| Closely Related | Event Control / Quiet Operations |

## AI Agent Notes

- No business logic in observers
- One observer per concern
- No heavy sync operations
- Use `saveQuietly()` to prevent infinite loops

## Verification

- [ ] Observers contain no business logic
- [ ] Observers are organized by concern (one per file)
- [ ] Heavy operations are dispatched as jobs
- [ ] No infinite event loops exist
