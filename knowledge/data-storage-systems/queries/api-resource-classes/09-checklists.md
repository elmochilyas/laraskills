# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.27 API resource classes and data shaping
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Narrow attribute selection applied
- [ ] Conditional relationship loading applied
- [ ] Resource per endpoint applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Accessor causing N+1**: A resource accesses `$this->someRelation->count()` which lazy loads the relation. Use `whenLoaded` or preload the relationship. prevented
- [ ] Including too many fields by default**: The resource includes all model attributes, exposing sensitive columns. Be explicit about included fields. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Resources have explicit, minimal field lists
- [ ] No N+1 queries from resource accessor calls
- [ ] List and detail views use different resources

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Narrow attribute selection applied
- [ ] Conditional relationship loading applied
- [ ] Resource per endpoint applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Generate resource: `php artisan make:resource PostResource` completed
- [ ] Define `toArray($request)` returning only needed fields completed
- [ ] Use `$this->whenLoaded('comments')` for conditional relationship inclusion completed
- [ ] Use `PostResource::collection($posts)` for list responses completed
- [ ] Use `PostResource::collection($posts)->response()` for paginated responses completed

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

- [ ] Accessor causing N+1**: A resource accesses `$this->someRelation->count()` which lazy loads the relation. Use `whenLoaded` or preload the relationship. prevented
- [ ] Including too many fields by default**: The resource includes all model attributes, exposing sensitive columns. Be explicit about included fields. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No N+1 from resource accessing unloaded relationships
- [ ] Sensitive fields are not included in the resource
- [ ] List resources are sparse (fewer fields than detail resources)
- [ ] Paginated resources properly wrap meta information
- [ ] Resources have explicit, minimal field lists
- [ ] No N+1 queries from resource accessor calls
- [ ] List and detail views use different resources
- [ ] Paginated responses include proper meta data

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
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Accessor causing N+1**: A resource accesses `$this->someRelation->count()` which lazy loads the relation. Use `whenLoaded` or preload the relationship. prevented
- [ ] Including too many fields by default**: The resource includes all model attributes, exposing sensitive columns. Be explicit about included fields. prevented

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
