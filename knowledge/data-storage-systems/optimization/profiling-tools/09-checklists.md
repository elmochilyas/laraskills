# Metadata

**Domain:** data-storage-systems
**Subdomain:** optimization
**Knowledge Unit:** 4.27 Laravel profiling tools: Telescope, Debugbar, Clockwork
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Telescope for staging/limited production applied
- [ ] Debugbar for local development applied
- [ ] Clockwork for lightweight profiling applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Telescope in production without pruning**: Telescope stores every request. Without `telescope:prune`, storage fills up. Schedule the prune command. prevented
- [ ] Debugbar in production**: Debugbar exposes query data, environment config, and route parameters. Only install as dev dependency. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Profiling tools installed in appropriate environments
- [ ] Slow endpoints identified with query-level breakdown
- [ ] Performance improvements verified by re-profiling

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Telescope for staging/limited production applied
- [ ] Debugbar for local development applied
- [ ] Clockwork for lightweight profiling applied
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed
- [ ] Use Cursor Pagination For Large Datasets followed
- [ ] Install Telescope for staging/limited production: `composer require laravel/telescope` completed
- [ ] Install Debugbar for local development: `composer require barryvdh/laravel-debugbar --dev` completed
- [ ] Run the target endpoint and review: completed
- [ ] Identify the most expensive operation completed
- [ ] Optimize and re-profile to compare completed

---

# Performance Checklist

- [ ] Performance: EXPLAIN ANALYZE reveals actual execution times vs estimates. Index scan vs sequential scan depends on table statistics. Join order in multi-table q...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Telescope in production without pruning**: Telescope stores every request. Without `telescope:prune`, storage fills up. Schedule the prune command. prevented
- [ ] Debugbar in production**: Debugbar exposes query data, environment config, and route parameters. Only install as dev dependency. prevented
- [ ] Always EXPLAIN Before Optimizing followed
- [ ] Avoid LIKE With Leading Wildcard followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Telescope installed and configured with access gate
- [ ] `telescope:prune` scheduled for production pruning
- [ ] Debugbar only installed as dev dependency
- [ ] No profiling tools active in production without monitoring
- [ ] Profiling tools installed in appropriate environments
- [ ] Slow endpoints identified with query-level breakdown
- [ ] Performance improvements verified by re-profiling

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
- [ ] Telescope in production without pruning**: Telescope stores every request. Without `telescope:prune`, storage fills up. Schedule the prune command. prevented
- [ ] Debugbar in production**: Debugbar exposes query data, environment config, and route parameters. Only install as dev dependency. prevented

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
