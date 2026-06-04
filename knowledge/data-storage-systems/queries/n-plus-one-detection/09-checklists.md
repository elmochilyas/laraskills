# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.28 N+1 detection via Laravel Telescope, Debugbar, or manual logging
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Telescope for development applied
- [ ] Debugbar for quick inspection applied
- [ ] Custom middleware for production monitoring applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Relying only on one tool**: Telescope catches what Debugbar misses and vice versa. Use multiple tools in different environments. prevented
- [ ] Ignoring production patterns**: N+1 that only appears at production data volumes won't show in development. Monitor query counts in production. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Query count per endpoint is stable and reasonable
- [ ] No repeated identical queries in request logs
- [ ] preventLazyLoading enabled in development/staging

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Telescope for development applied
- [ ] Debugbar for quick inspection applied
- [ ] Custom middleware for production monitoring applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Enable Telescope or Debugbar in development completed
- [ ] Execute the endpoint or command completed
- [ ] Check query count — if it's much higher than expected, look for repeated patterns completed
- [ ] Identify the repeated query: `SELECT * FROM comments WHERE post_id = 1`, `... WHERE post_id = 2`, etc. completed
- [ ] Add eager loading: `$posts->load('comments')` or `Post::with('comments')` completed

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

- [ ] Relying only on one tool**: Telescope catches what Debugbar misses and vice versa. Use multiple tools in different environments. prevented
- [ ] Ignoring production patterns**: N+1 that only appears at production data volumes won't show in development. Monitor query counts in production. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Query count per request is reasonable (< 10-20 for most endpoints)
- [ ] No repeated queries with different WHERE values
- [ ] All relationships used in the response are eager loaded
- [ ] preventLazyLoading enabled in non-production environments
- [ ] Query count per endpoint is stable and reasonable
- [ ] No repeated identical queries in request logs
- [ ] preventLazyLoading enabled in development/staging
- [ ] Production monitoring alerts on excessive query counts

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
- [ ] ### Relying only on one tool prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Relying only on one tool**: Telescope catches what Debugbar misses and vice versa. Use multiple tools in different environments. prevented
- [ ] Ignoring production patterns**: N+1 that only appears at production data volumes won't show in development. Monitor query counts in production. prevented

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
