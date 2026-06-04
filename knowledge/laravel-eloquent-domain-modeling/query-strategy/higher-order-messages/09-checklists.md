# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Query Strategy
**Knowledge Unit:** Higher Order Messages
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `map()` and `filter()` only used for small result sets (< 1000 records)
- [ ] Relationships eager-loaded before HOM chains
- [ ] `each()` callbacks do not modify the query source during iteration
- [ ] Connection not saturated by long-running `cursor()` iterations
- [ ] No N+1 from lazy loading inside HOM callbacks
- [ ] HOM chains are 3 methods max
- [ ] `tap()` not used for state mutation

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Keep HOM callbacks simple (1-3 lines); extract complex logic to named methods or classes
- [ ] Architecture guideline: - Use `pipe()` to encapsulate complex collection transformations in testable units
- [ ] Architecture guideline: - Document when HOMs are used for memory optimization vs convenience
- [ ] Architecture guideline: - Avoid HOM chains that mix query construction and result transformation in the same expression
- [ ] Decision: each() vs map() vs filter() Selection - ensure correct choice is made
- [ ] Decision: HOM Memory Safety - ensure correct choice is made
- [ ] Decision: N+1 Prevention in HOM Callbacks - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Process Query Results with Higher Order Messages

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] No specific performance concerns identified in source files

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
- [ ] `map()` and `filter()` only used for small result sets (< 1000 records)
- [ ] Relationships eager-loaded before HOM chains
- [ ] `each()` callbacks do not modify the query source during iteration
- [ ] Connection not saturated by long-running `cursor()` iterations
- [ ] No N+1 from lazy loading inside HOM callbacks
- [ ] HOM chains are 3 methods max
- [ ] `tap()` not used for state mutation

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
### Skills (from 06)
- Process Query Results with Higher Order Messages
### Decision Trees (from 07)
- each() vs map() vs filter() Selection
- HOM Memory Safety
- N+1 Prevention in HOM Callbacks
### Related Rules (from 06 skills)
- Use each() for Side Effects Only â€” It Returns Void (query-strategy/higher-order-messages)
- Eager-Load Relationships Before Higher Order Message Chains (query-strategy/higher-order-messages)
- Use filter() HOM Only When SQL Cannot Express the Condition (query-strategy/higher-order-messages)
- Limit HOM Chains to 2-3 Methods Maximum (query-strategy/higher-order-messages)
- Never Call get() Before HOMs (query-strategy/higher-order-messages)
- Avoid map() for Large Datasets (query-strategy/higher-order-messages)
- Use tap() for Logging and Monitoring, Not for State Mutation (query-strategy/higher-order-messages)
### Related Skills (from 06 skills)
- Implement Memory-Efficient Streaming with cursor
- Compose Conditional Query Chains with when()
- Evaluate Performance Tradeoffs with Profiling

