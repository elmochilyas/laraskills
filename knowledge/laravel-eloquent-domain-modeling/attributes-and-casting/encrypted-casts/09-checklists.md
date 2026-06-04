# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Encrypted Casts
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Performance: - Encryption/decryption adds ~1-5ms per attribute access â€” negligible for s...
- [ ] Performance: - Each read of an encrypted attribute triggers decryption â€” accessing the s...
- [ ] Performance: - Encrypted casts cannot participate in database-level sorting, filtering, or...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Use `encrypted:array` for JSON config data, `encrypted` for scalar secrets
- [ ] Architecture guideline: - Store searchable hash in a separate column for lookup-required encrypted fields
- [ ] Architecture guideline: - Never use encrypted casts on primary or foreign key columns
- [ ] Architecture guideline: - Add application-level indexing of encrypted columns is impossible â€” plan queries accordingly
- [ ] Decision: Encrypt vs Don't Encrypt a Column - ensure correct choice is made
- [ ] Decision: Encrypted Scalar vs Encrypted Array vs Encrypted Collection - ensure correct choice is made
- [ ] Decision: Searchable Hash Column vs Full Table Scan - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Encryption/decryption adds ~1-5ms per attribute access â€” negligible for single values, significant for bulk opera...
- [ ] - Each read of an encrypted attribute triggers decryption â€” accessing the same attribute multiple times is wasteful
- [ ] - Encrypted casts cannot participate in database-level sorting, filtering, or joining

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - **APP_KEY is a critical secret**: If compromised, all encrypted data can be decrypted. Store securely, rotate perio...
- [ ] - Key rotation: Laravel doesn't support automatic key rotation for encrypted casts. Plan for data migration when rota...
- [ ] - Encrypted casts use Laravel's `Crypt` facade â€” ensure `config('app.cipher')` uses a modern algorithm (AES-256-GCM...

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
- Encrypt vs Don't Encrypt a Column
- Encrypted Scalar vs Encrypted Array vs Encrypted Collection
- Searchable Hash Column vs Full Table Scan

