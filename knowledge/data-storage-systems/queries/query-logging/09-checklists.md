# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.29 Query logging (DB::listen, enableQueryLog)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Slow query alert applied
- [ ] Test assertions applied
- [ ] Long-running process cleanup applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Leaving query logging enabled in production**: `getQueryLog()` stores all queries in memory per request. On high-traffic endpoints, this exhausts PHP memory. prevented
- [ ] Using getQueryLog() without disableQueryLog()**: Queries accumulate. After retrieving, call `disableQueryLog()` to clear. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] DB::listen properly captures and logs queries
- [ ] Test assertions verify query counts correctly
- [ ] Slow query alerts fire at the configured threshold

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Slow query alert applied
- [ ] Test assertions applied
- [ ] Long-running process cleanup applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] For slow query alerting: `DB::listen(fn($q) => $q->time > 100 && Log::warning(...))` completed
- [ ] For test assertions: `DB::enableQueryLog(); // execute; $this->assertCount(2, DB::getQueryLog())` completed
- [ ] For debugging: register DB::listen in AppServiceProvider or a middleware completed
- [ ] Clean up in long-running processes: `DB::disableQueryLog()` completed

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

- [ ] Leaving query logging enabled in production**: `getQueryLog()` stores all queries in memory per request. On high-traffic endpoints, this exhausts PHP memory. prevented
- [ ] Using getQueryLog() without disableQueryLog()**: Queries accumulate. After retrieving, call `disableQueryLog()` to clear. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Query logging is disabled in production (unless specific monitoring)
- [ ] getQueryLog() is followed by disableQueryLog() to clear memory
- [ ] Slow query threshold is appropriate (typically 100-200ms)
- [ ] Test assertions correctly verify expected query count
- [ ] DB::listen properly captures and logs queries
- [ ] Test assertions verify query counts correctly
- [ ] Slow query alerts fire at the configured threshold
- [ ] Query logging is not enabled in production

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
- [ ] ### Leaving query logging enabled in production prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Leaving query logging enabled in production**: `getQueryLog()` stores all queries in memory per request. On high-traffic endpoints, this exhausts PHP memory. prevented
- [ ] Using getQueryLog() without disableQueryLog()**: Queries accumulate. After retrieving, call `disableQueryLog()` to clear. prevented

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
