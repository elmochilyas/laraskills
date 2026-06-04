# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Money/Email/Address Patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Performance: - Money arithmetic with `brick/money` adds minimal overhead vs float operations
- [ ] Performance: - Email validation (`filter_var`) is fast (~0.01ms per call)
- [ ] Performance: - Address value objects with multiple fields add construction overhead per re...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Place in `App\ValueObjects\Money`, `App\ValueObjects\Email`, `App\ValueObjects\Address`
- [ ] Architecture guideline: - Implement `Castable` interface for self-casting
- [ ] Architecture guideline: - Use `brick/money` for Monetary types (not homemade float arithmetic)
- [ ] Architecture guideline: - Normalize emails to lowercase before storage
- [ ] Decision: Integer Cents vs `brick/money` vs Float for Monetary Values - ensure correct choice is made
- [ ] Decision: Structured Address Value Object vs Unstructured String - ensure correct choice is made
- [ ] Decision: Normalized Email vs Preserved Case Email Storage - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Money arithmetic with `brick/money` adds minimal overhead vs float operations
- [ ] - Email validation (`filter_var`) is fast (~0.01ms per call)
- [ ] - Address value objects with multiple fields add construction overhead per read â€” acceptable for typical usage

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Validate email format before storage â€” prevents injection of malformed addresses
- [ ] - Sanitize address components for XSS when rendering
- [ ] - Money amounts should use integer cents internally, never floats

# Reliability Checklist (from 04/05/06)
- [ ] Error handling covers all failure modes
- [ ] Database transactions wrap multi-step operations
- [ ] Stateless design enforced (no mutable per-request state)
- [ ] Logging is configured for debugging without leaking sensitive data

# Testing Checklist (from 04/06)
- [ ] Unit tests cover happy path
- [ ] Unit tests cover error/exception paths
- [ ] Tests are isolated (no shared mutable state between tests)
- [ ] Test coverage includes edge cases
- [ ] Architecture tests enforce patterns (Pest arch tests)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] No anti-patterns or common mistakes documented for this KU

# Production Readiness Checklist
- [ ] All configuration values have production-safe defaults
- [ ] Error responses do not leak stack traces or internals
- [ ] Logging level is appropriate for production (INFO/WARN/ERROR)
- [ ] Feature flags or toggles are in place for risky changes
- [ ] Migration rollback strategy is defined
- [ ] Rate limiting is applied where appropriate
- [ ] Monitoring/alerting is configured for failure modes
- [ ] Dependencies are up to date with no known vulnerabilities

# Final Approval Checklist
- [ ] All previous checklist sections have been reviewed and satisfied
- [ ] Code review has been completed by at least one peer
- [ ] The implementation matches the approved design/architecture
- [ ] Tests pass in CI environment
- [ ] Documentation is updated (if applicable)
- [ ] No known regressions introduced
- [ ] Change log entry is added (if applicable)

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Decision Trees (from 07)
- Integer Cents vs `brick/money` vs Float for Monetary Values
- Structured Address Value Object vs Unstructured String
- Normalized Email vs Preserved Case Email Storage

