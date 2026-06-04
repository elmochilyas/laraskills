# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.11 gh-ost tool (binlog-based, trigger-free, pause/resume, test-on-replica)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Test-on-replica first applied
- [ ] Throttle during peak traffic applied
- [ ] Default cut-over applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Not testing on replica first**: Running gh-ost on production without verifying on a replica. A misconfiguration can cause extended write blocking. prevented
- [ ] Cut-over timeout**: The cut-over lock wait timeout is exceeded because the ghost table is still catching up. This extends the write-blocking window. prevented
- [ ] Insufficient binlog retention**: gh-ost must read binlogs from the start of the migration. If binlog retention is too short, gh-ost fails with "binlog not found" error. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Schema change completes without production downtime
- [ ] Test-on-replica validates the migration before primary execution
- [ ] Throttling prevents replication lag spikes

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Test-on-replica first applied
- [ ] Throttle during peak traffic applied
- [ ] Default cut-over applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Verify binlog settings: `SHOW VARIABLES LIKE 'binlog_format'` must return ROW completed
- [ ] Run a test migration on a replica first: `gh-ost --test-on-replica --host=replica_host --alter "ADD COLUMN status INT" --table orders --database my... completed
- [ ] Review the test output for row count, timing, and any errors completed
- [ ] Run the migration on the primary: `gh-ost --alter "ADD COLUMN status INT" --table orders --database myapp --execute` completed
- [ ] Monitor progress via the socket file: `echo progress | nc -U /tmp/gh-ost.orders.sock` completed

---

# Performance Checklist

- [ ] Performance: - gh-ost reads type table in chunks — chunk size determines rows-per-statement and affects load.
- [ ] Performance: - Binlog streaming adds minimal overhead (< 5% write amplification).
- [ ] Performance: - Throttle by replication lag: if replica lag exceeds threshold (default 10 seconds), gh-ost pauses row copy.
- [ ] Performance: - Network latency between gh-ost host and MySQL affects throughput.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Not testing on replica first**: Running gh-ost on production without verifying on a replica. A misconfiguration can cause extended write blocking. prevented
- [ ] Cut-over timeout**: The cut-over lock wait timeout is exceeded because the ghost table is still catching up. This extends the write-blocking window. prevented
- [ ] Insufficient binlog retention**: gh-ost must read binlogs from the start of the migration. If binlog retention is too short, gh-ost fails with "binlog not found" error. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] binlog_format is ROW with row_image FULL
- [ ] Test-on-replica completed successfully before production run
- [ ] Disk space is sufficient for the shadow table
- [ ] Throttle thresholds are configured for the workload
- [ ] Cut-over lock duration is measured and acceptable
- [ ] Schema change completes without production downtime
- [ ] Test-on-replica validates the migration before primary execution
- [ ] Throttling prevents replication lag spikes
- [ ] Cut-over completes within sub-second lock window
- [ ] Binlog retention covers the full migration duration

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Test Migrations Before Production prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Insufficient binlog retention prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Not testing on replica first**: Running gh-ost on production without verifying on a replica. A misconfiguration can cause extended write blocking. prevented
- [ ] Cut-over timeout**: The cut-over lock wait timeout is exceeded because the ghost table is still catching up. This extends the write-blocking window. prevented
- [ ] Insufficient binlog retention**: gh-ost must read binlogs from the start of the migration. If binlog retention is too short, gh-ost fails with "binlog not found" error. prevented

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
