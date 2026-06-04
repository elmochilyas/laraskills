# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** State Pattern Fundamentals
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Represent Each State as a Backed PHP Enum
- [ ] Enforce: Make Invalid State Transitions Impossible at the Type Level
- [ ] Enforce: Separate State Data from State Behavior
- [ ] Enforce: Define the Complete Transition Map in a Single Visible Location
- [ ] Enforce: Use Eloquent's Enum Cast for the State Column
- [ ] Enforce: Test the Complete Transition Matrix
- [ ] Enforce: Apply Transition Guards at the State Machine Level, Not in Callers
- [ ] Performance: - State resolution (converting DB value to state object) adds minimal overhead
- [ ] Performance: - State classes are typically short-lived â€” one per state transition
- [ ] Performance: - Complex transition guards may add validation overhead for frequent transitions

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Store state as a database column (string or integer backed enum)
- [ ] Architecture guideline: - Use Eloquent's `enum` cast for the state column
- [ ] Architecture guideline: - State-specific behavior can be in switch statements, strategy pattern, or state classes
- [ ] Architecture guideline: - Transaction guards validate preconditions before transitions

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Represent Each State as a Backed PHP Enum
- [ ] Apply rule: Make Invalid State Transitions Impossible at the Type Level
- [ ] Apply rule: Separate State Data from State Behavior
- [ ] Apply rule: Define the Complete Transition Map in a Single Visible Location
- [ ] Apply rule: Use Eloquent's Enum Cast for the State Column
- [ ] Apply rule: Test the Complete Transition Matrix
- [ ] Apply rule: Apply Transition Guards at the State Machine Level, Not in Callers

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - State resolution (converting DB value to state object) adds minimal overhead
- [ ] - State classes are typically short-lived â€” one per state transition
- [ ] - Complex transition guards may add validation overhead for frequent transitions

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
- Represent Each State as a Backed PHP Enum
- Make Invalid State Transitions Impossible at the Type Level
- Separate State Data from State Behavior
- Define the Complete Transition Map in a Single Visible Location
- Use Eloquent's Enum Cast for the State Column
- Test the Complete Transition Matrix
- Apply Transition Guards at the State Machine Level, Not in Callers

