# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.23 chunk/chunkById/lazy/lazyById cursor processing
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Use chunkById for data migrations and backfills applied
- [ ] Use cursor for memory-efficient exports applied
- [ ] Use lazy for complex collection pipelines applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Using chunk on a table where rows are being modified**: Rows shift between chunks due to OFFSET. Use chunkById instead. prevented
- [ ] Using cursor inside a queued job**: Holding the database cursor for a long time while other queue workers compete for connections. Use chunkById for queued jobs. prevented
- [ ] Not freeing cursor resources**: Cursor reads the entire result set. If an exception occurs mid-iteration, the cursor is not properly closed, potentially leaking resources. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] chunkById used in all production batch processing
- [ ] Memory usage stays within limits for large datasets
- [ ] Cursor operations properly handle exceptions and cleanup

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Use chunkById for data migrations and backfills applied
- [ ] Use cursor for memory-efficient exports applied
- [ ] Use lazy for complex collection pipelines applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Estimate dataset size and memory requirement completed
- [ ] For stable batch processing: use `Model::chunkById(100, fn($records) => ...)` completed
- [ ] For memory-efficient exports: use `Model::cursor()` with a generator completed
- [ ] For collection pipelines: use `Model::lazy()` or `Model::lazyById()` completed
- [ ] For simple pagination on read-only tables: use `Model::chunk(100, fn($records) => ...)` completed

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

- [ ] Using chunk on a table where rows are being modified**: Rows shift between chunks due to OFFSET. Use chunkById instead. prevented
- [ ] Using cursor inside a queued job**: Holding the database cursor for a long time while other queue workers compete for connections. Use chunkById for queued jobs. prevented
- [ ] Not freeing cursor resources**: Cursor reads the entire result set. If an exception occurs mid-iteration, the cursor is not properly closed, potentially leaking resources. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] chunkById used instead of chunk for production tables with writes/deletes
- [ ] cursor not used inside long-running queue jobs (holds connection open)
- [ ] Exception handling ensures cursor resources are freed
- [ ] chunk size is tuned (100-500 records per chunk)
- [ ] chunkById used in all production batch processing
- [ ] Memory usage stays within limits for large datasets
- [ ] Cursor operations properly handle exceptions and cleanup
- [ ] Appropriate strategy chosen based on dataset characteristics

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
- [ ] ### Using chunk on tables being modified prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Using chunk on a table where rows are being modified**: Rows shift between chunks due to OFFSET. Use chunkById instead. prevented
- [ ] Using cursor inside a queued job**: Holding the database cursor for a long time while other queue workers compete for connections. Use chunkById for queued jobs. prevented
- [ ] Not freeing cursor resources**: Cursor reads the entire result set. If an exception occurs mid-iteration, the cursor is not properly closed, potentially leaking resources. prevented

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
