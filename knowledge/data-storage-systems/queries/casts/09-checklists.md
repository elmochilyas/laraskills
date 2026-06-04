# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.17 Casts (native types, Enum, custom casts, JSON, encrypted)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Use casts over accessors for type conversion applied
- [ ] Enum casts for status fields applied
- [ ] Encrypted casts for PII applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Casting to integer for large numbers**: `bigInteger` columns may overflow PHP's integer type. Use `decimal` or string casts for large values. prevented
- [ ] JSON cast without json column type**: Casting to `array` on a string column works but loses the database's JSON validation. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] All type conversions use `$casts` instead of manual accessors
- [ ] Enum casts used for constrained value fields
- [ ] bigInteger columns use string/decimal casts to prevent overflow

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Use casts over accessors for type conversion applied
- [ ] Enum casts for status fields applied
- [ ] Encrypted casts for PII applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Add to `$casts` array: `protected $casts = ['is_admin' => 'boolean']` completed
- [ ] For enum casts: `'status' => OrderStatus::class` (OrderStatus is a PHP enum) completed
- [ ] For JSON casts: `'metadata' => 'array'` or `'metadata' => 'object'` completed
- [ ] For encrypted casts: `'ssn' => 'encrypted'` completed
- [ ] For custom casts: implement `CastsAttributes` interface and register completed

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

- [ ] Casting to integer for large numbers**: `bigInteger` columns may overflow PHP's integer type. Use `decimal` or string casts for large values. prevented
- [ ] JSON cast without json column type**: Casting to `array` on a string column works but loses the database's JSON validation. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] bigInteger casts use string or decimal to prevent overflow
- [ ] JSON cast columns use JSON column type in the database
- [ ] Enum casts map to PHP backed enums matching database values
- [ ] Encrypted casts on sensitive columns (PII, credentials)
- [ ] All type conversions use `$casts` instead of manual accessors
- [ ] Enum casts used for constrained value fields
- [ ] bigInteger columns use string/decimal casts to prevent overflow
- [ ] Sensitive columns use encrypted casts

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
- [ ] ### Casting to integer for large numbers prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Casting to integer for large numbers**: `bigInteger` columns may overflow PHP's integer type. Use `decimal` or string casts for large values. prevented
- [ ] JSON cast without json column type**: Casting to `array` on a string column works but loses the database's JSON validation. prevented

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
