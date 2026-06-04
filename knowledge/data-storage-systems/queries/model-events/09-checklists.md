# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.19 Model events (retrieved, creating, created, updating, updated, saving, saved, deleting, deleted, trashed, forceDeleted)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Automatic slug generation applied
- [ ] Cache invalidation applied
- [ ] Observer for cross-cutting concerns applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Performing heavy operations in events**: API calls, long computations, or queue dispatches inside model events — these block the HTTP response. prevented
- [ ] Model events not firing in bulk operations**: `User::query()->update(...)` does NOT fire model events. Only individual model `save()`, `update()`, `delete()` calls fire events. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Side effects are properly attached to lifecycle events
- [ ] Heavy operations are queued, not blocking
- [ ] Observer classes organize related event logic

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Automatic slug generation applied
- [ ] Cache invalidation applied
- [ ] Observer for cross-cutting concerns applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Register event in model's `boot()` method or create an Observer class completed
- [ ] For simple events: `static::creating(fn($model) => $model->slug = Str::slug($model->title))` completed
- [ ] For multiple events on one model: create `PostObserver` with methods matching event names completed
- [ ] Register observer in `AppServiceProvider::boot()`: `Post::observe(PostObserver::class)` completed
- [ ] Return false from creating/updating/saving/deleting to cancel the operation completed

---

# Performance Checklist

- [ ] Performance: Eager loading reduces query count from N+1 to 2 queries. chunkById is preferable to chunk for production processing as it avoids offset drift. Subq...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Performing heavy operations in events**: API calls, long computations, or queue dispatches inside model events — these block the HTTP response. prevented
- [ ] Model events not firing in bulk operations**: `User::query()->update(...)` does NOT fire model events. Only individual model `save()`, `update()`, `delete()` calls fire events. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Heavy operations queue jobs instead of blocking in events
- [ ] Bulk operations (query()->update()) are handled separately (events don't fire)
- [ ] Observers registered in a service provider
- [ ] Returning false is used intentionally for cancellation
- [ ] Side effects are properly attached to lifecycle events
- [ ] Heavy operations are queued, not blocking
- [ ] Observer classes organize related event logic
- [ ] Bulk operations don't silently skip expected event logic

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Eager-Load Relationships In Loops prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Performing heavy operations in events prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Performing heavy operations in events**: API calls, long computations, or queue dispatches inside model events — these block the HTTP response. prevented
- [ ] Model events not firing in bulk operations**: `User::query()->update(...)` does NOT fire model events. Only individual model `save()`, `update()`, `delete()` calls fire events. prevented

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge

Reference: ./04-standardized-knowledge.md

# Related Rules

Reference: ./05-rules.md

# Related Skills

Reference: ./06-skills.md

# Related Decision Trees

Reference: ./07-decision-trees.md

# Related Anti-Patterns

Reference: ./08-anti-patterns.md
