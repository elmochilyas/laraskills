# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.28 Endpoint-level query governance (max queries per request, max query time)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Per-endpoint governance via middleware parameters applied
- [ ] Telescope-based soft governance without deployment applied
- [ ] Row-examined governance via database proxy applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Setting limits too tight**: A hard limit of 5 queries per request will break any page with eager loading of 3+ relationships and their counts. Start with generous limits and tighten iteratively. prevented
- [ ] No governance on queue jobs**: Queue jobs often query more aggressively than HTTP endpoints because "it's async." A single faulty job can consume the entire connection pool. prevented
- [ ] Governance only in the app layer**: A developer can disable the middleware or bypass governance. Pair application-layer governance with database-layer `MAX_EXECUTION_TIME` for defense in depth. prevented
- [ ] Forgetting Octane**: In Octane, `DB::listen()` callbacks persist across requests if registered in a service provider's `boot()` method. Reset governance counters in the request lifecycle to avoid cross-request leakage. prevented
- [ ] ```php prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Governance middleware enforces per-endpoint query budgets
- [ ] Excessive query patterns detected and blocked early
- [ ] Database-level timeouts provide defense in depth

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Per-endpoint governance via middleware parameters applied
- [ ] Telescope-based soft governance without deployment applied
- [ ] Row-examined governance via database proxy applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Define governance tiers: API (strict), web (moderate), admin (relaxed), reports (opt-in) completed
- [ ] Create middleware that tracks query count and total duration via `DB::listen()` completed
- [ ] Enforce hard limits (throw exception) for strict tiers completed
- [ ] Enforce soft limits (log warning) for moderate tiers completed
- [ ] Set database-level safety nets: `MAX_EXECUTION_TIME` (MySQL) or `statement_timeout` (PostgreSQL) completed

---

# Performance Checklist

- [ ] Performance: - `DB::listen()` callback overhead is negligible (~1-5 microseconds per query) for most applications. At 500+ queries per request, the cumulative o...
- [ ] Performance: - Use `MAX_EXECUTION_TIME` (MySQL 5.7+) or `statement_timeout` (PostgreSQL) as a last-resort database safety net. These kill the query at the datab...
- [ ] Performance: - Connection pool monitoring (`SHOW PROCESSLIST`, `pg_stat_activity`) reveals idle-in-transaction queries or queries that exceed their governance a...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Setting limits too tight**: A hard limit of 5 queries per request will break any page with eager loading of 3+ relationships and their counts. Start with generous limits and tighten iteratively. prevented
- [ ] No governance on queue jobs**: Queue jobs often query more aggressively than HTTP endpoints because "it's async." A single faulty job can consume the entire connection pool. prevented
- [ ] Governance only in the app layer**: A developer can disable the middleware or bypass governance. Pair application-layer governance with database-layer `MAX_EXECUTION_TIME` for defense in depth. prevented
- [ ] Forgetting Octane**: In Octane, `DB::listen()` callbacks persist across requests if registered in a service provider's `boot()` method. Reset governance counters in the request lifecycle to avoid cross-request leakage. prevented
- [ ] ```php prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Governance middleware applied to route groups with appropriate limits
- [ ] Hard limits for API endpoints (e.g., max 10 queries, 200ms)
- [ ] Database-level timeouts set as safety net
- [ ] Octane-compatible counter reset implementation
- [ ] Queue jobs also have governance limits
- [ ] Governance middleware enforces per-endpoint query budgets
- [ ] Excessive query patterns detected and blocked early
- [ ] Database-level timeouts provide defense in depth
- [ ] No connection pool exhaustion from runaway endpoints

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always EXPLAIN Before Optimizing prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Skipping Validation Steps prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Setting limits too tight**: A hard limit of 5 queries per request will break any page with eager loading of 3+ relationships and their counts. Start with generous limits and tighten iteratively. prevented
- [ ] No governance on queue jobs**: Queue jobs often query more aggressively than HTTP endpoints because "it's async." A single faulty job can consume the entire connection pool. prevented
- [ ] Governance only in the app layer**: A developer can disable the middleware or bypass governance. Pair application-layer governance with database-layer `MAX_EXECUTION_TIME` for defense in depth. prevented
- [ ] Forgetting Octane**: In Octane, `DB::listen()` callbacks persist across requests if registered in a service provider's `boot()` method. Reset governance counters in the request lifecycle to avoid cross-request leakage. prevented
- [ ] ```php prevented
- [ ] // Octane-safe governance: reset counters on request start prevented
- [ ] public function handle(Request $request, Closure $next): mixed prevented
- [ ] { prevented
- [ ] $this->queryCount = 0; prevented
- [ ] $this->totalDuration = 0; prevented

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
