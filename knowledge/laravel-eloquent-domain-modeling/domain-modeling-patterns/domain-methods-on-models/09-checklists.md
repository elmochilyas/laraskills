# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Domain Methods on Models
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Name Domain Methods in Ubiquitous Language
- [ ] Enforce: Guard Preconditions at the Start of Every Domain Method
- [ ] Enforce: Keep Domain Methods Free of External Side Effects
- [ ] Enforce: Give Each Domain Method a Single Responsibility
- [ ] Enforce: Throw Domain-Specific Exception Classes
- [ ] Enforce: Call `$this->save()` Inside the Domain Method
- [ ] Enforce: Do Not Pass External Parameters That Change Behavior Semantics
- [ ] Performance: - Domain methods add no overhead â€” they are standard PHP method calls
- [ ] Performance: - Each method typically calls `save()` once â€” batch when updating multiple ...
- [ ] Performance: - Avoid expensive operations inside domain methods (defer to events or actions)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Domain methods are public, named in ubiquitous language
- [ ] Architecture guideline: - They call `$this->save()` internally after state changes
- [ ] Architecture guideline: - They throw domain-specific exceptions on invariant violation
- [ ] Architecture guideline: - They do not call external services, dispatch jobs, or send emails

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Name Domain Methods in Ubiquitous Language
- [ ] Apply rule: Guard Preconditions at the Start of Every Domain Method
- [ ] Apply rule: Keep Domain Methods Free of External Side Effects
- [ ] Apply rule: Give Each Domain Method a Single Responsibility
- [ ] Apply rule: Throw Domain-Specific Exception Classes
- [ ] Apply rule: Call `$this->save()` Inside the Domain Method
- [ ] Apply rule: Do Not Pass External Parameters That Change Behavior Semantics

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Domain methods add no overhead â€” they are standard PHP method calls
- [ ] - Each method typically calls `save()` once â€” batch when updating multiple attributes
- [ ] - Avoid expensive operations inside domain methods (defer to events or actions)

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged

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
### Rules (from 05)
- Name Domain Methods in Ubiquitous Language
- Guard Preconditions at the Start of Every Domain Method
- Keep Domain Methods Free of External Side Effects
- Give Each Domain Method a Single Responsibility
- Throw Domain-Specific Exception Classes
- Call `$this->save()` Inside the Domain Method
- Do Not Pass External Parameters That Change Behavior Semantics

