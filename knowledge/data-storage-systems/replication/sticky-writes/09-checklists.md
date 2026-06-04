# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.4 Sticky writes (reading-after-write consistency issue)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Session sticky writes applied
- [ ] Redirect with cache bust applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Disabling $recordsModified globally**: Breaks read-after-write consistency for all users. Only disable if you understand the consistency tradeoff. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Users see their writes immediately after form submission
- [ ] Stale reads eliminated within the same request
- [ ] Read replicas still serve independent read traffic

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Session sticky writes applied
- [ ] Redirect with cache bust applied
- [ ] Always Monitor Replica Lag followed
- [ ] Enable sticky writes in `config/database.php`: completed
- [ ] Laravel's behavior: after any write on a connection, `$recordsModified = true` completed
- [ ] Subsequent reads on that connection use the write PDO (not replica) completed
- [ ] `$recordsModified` resets at the end of the request completed
- [ ] Test: create a record, redirect to list page, verify the new record appears immediately completed

---

# Performance Checklist

- [ ] Performance: Synchronous replication increases write latency but guarantees zero data loss. Asynchronous replication allows read scaling at the cost of eventual...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Disabling $recordsModified globally**: Breaks read-after-write consistency for all users. Only disable if you understand the consistency tradeoff. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Sticky writes enabled in config
- [ ] After write, subsequent reads use write connection
- [ ] Sticky writes don't persist across requests
- [ ] No stale data served after write within same request
- [ ] Users see their writes immediately after form submission
- [ ] Stale reads eliminated within the same request
- [ ] Read replicas still serve independent read traffic

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Monitor Replica Lag prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Sticky writes disabled â€” user doesn't see their own write on next page load prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Disabling $recordsModified globally**: Breaks read-after-write consistency for all users. Only disable if you understand the consistency tradeoff. prevented

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
