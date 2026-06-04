# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.2 Blueprint column types (all available types per driver)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Smallest type for the data applied
- [ ] Monetary values applied
- [ ] UUID/ULID for public IDs applied
- [ ] nullable timestamps applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Using float for currency**: Floating-point types introduce rounding errors that accumulate over thousands of transactions. Use `decimal` or integer minor units. prevented
- [ ] Oversized string columns**: `string('bio', 65535)` or defaulting to `text` for every string wastes storage and limits in-memory sorting performance. prevented
- [ ] unsigned mismatch**: `foreignId()` creates `unsignedBigInteger`. Defining the referenced PK as `increments()` (signed integer) causes FK constraint failure. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Every column uses the smallest appropriate type for its data
- [ ] Monetary values avoid floating-point errors
- [ ] FK columns use unsignedBigInteger matching the referenced PK

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Smallest type for the data applied
- [ ] Monetary values applied
- [ ] UUID/ULID for public IDs applied
- [ ] nullable timestamps applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Identify the semantic type: numeric (amount, count, ID), string (name, description), date/time, JSON, spatial, or binary completed
- [ ] Choose the smallest type that fits the data: `tinyInteger` for flags, `smallInteger` for small ranges, `integer` for most IDs, `bigInteger` for dis... completed
- [ ] For monetary values, use `decimal(precision, scale)` or `integer` storing minor units — never `float` or `double` completed
- [ ] For public-facing identifiers, use `uuid()` or `ulid()` instead of auto-increment completed
- [ ] For text searchable columns, use `string(length)` instead of `text` to enable full indexing completed

---

# Performance Checklist

- [ ] Performance: - `string('column', 255)` uses more storage than the data requires in MySQL (fixed overhead per row in some engines).
- [ ] Performance: - `jsonb` indexing (PostgreSQL) enables performant JSON queries. `json` (MySQL) cannot be directly indexed, requiring generated columns.
- [ ] Performance: - `text` columns cannot be fully indexed in MySQL (prefix index only). Use `string` for searchable columns.
- [ ] Performance: - `decimal` operations are slower than integer operations due to software computation in some databases.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Using float for currency**: Floating-point types introduce rounding errors that accumulate over thousands of transactions. Use `decimal` or integer minor units. prevented
- [ ] Oversized string columns**: `string('bio', 65535)` or defaulting to `text` for every string wastes storage and limits in-memory sorting performance. prevented
- [ ] unsigned mismatch**: `foreignId()` creates `unsignedBigInteger`. Defining the referenced PK as `increments()` (signed integer) causes FK constraint failure. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Smallest type that fits the data range is selected
- [ ] Monetary values use `decimal` or integer minor units
- [ ] String columns have explicit length limits
- [ ] Public-facing IDs use `uuid()` or `ulid()`
- [ ] `foreignId()` matches referenced PK type
- [ ] Every column uses the smallest appropriate type for its data
- [ ] Monetary values avoid floating-point errors
- [ ] FK columns use unsignedBigInteger matching the referenced PK
- [ ] Public IDs use UUID/ULID for security and distribution
- [ ] String columns set explicit length bounds

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
- [ ] ### float for currency prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Using float for currency**: Floating-point types introduce rounding errors that accumulate over thousands of transactions. Use `decimal` or integer minor units. prevented
- [ ] Oversized string columns**: `string('bio', 65535)` or defaulting to `text` for every string wastes storage and limits in-memory sorting performance. prevented
- [ ] unsigned mismatch**: `foreignId()` creates `unsignedBigInteger`. Defining the referenced PK as `increments()` (signed integer) causes FK constraint failure. prevented

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
