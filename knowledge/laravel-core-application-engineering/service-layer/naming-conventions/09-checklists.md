# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Service Layer Pattern
**Knowledge Unit:** Service Naming Conventions
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Use Entity-Oriented Names
- [ ] Verify: Use Business Verbs, Not HTTP Verbs
- [ ] Verify: Avoid Service Suffix on Method Names
- [ ] Verify: Use Domain Subdirectories for Scale
- [ ] Class name follows `{Entity}Service` or `{Capability}Service` pattern
- [ ] Class name ends with `Service` suffix
- [ ] No generic names: `HelperService`, `UtilityService`, `ManagerService`, `CommonService`
- [ ] Namespace is `App\Services\{Domain}\{Entity}Service`
- [ ] Domain subdirectories used when 20+ service files exist
- [ ] Method names are business verbs, not HTTP verbs (`register()` not `store()`)
- [ ] Method names do not repeat the entity name (`$order->place()` not `$order->placeOrder()`)
- [ ] All developers on the team use the same naming convention
- [ ] Naming convention is documented

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Decision: Entity-Oriented Names vs Capability-Oriented Names - ensure correct choice is made
- [ ] Decision: Business Verb Methods vs HTTP Verb Methods - ensure correct choice is made
- [ ] Decision: Domain Subdirectories vs Flat Service Directory - ensure correct choice is made
- [ ] Decision: Service Suffix vs Abstract/Manager/Helper Names - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Use Entity-Oriented Names
- [ ] Best practice: Use Business Verbs, Not HTTP Verbs
- [ ] Best practice: Avoid Service Suffix on Method Names
- [ ] Best practice: Use Domain Subdirectories for Scale
- [ ] Skill applied: Name Service Classes and Methods by Convention

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
- [ ] Class name follows `{Entity}Service` or `{Capability}Service` pattern
- [ ] Class name ends with `Service` suffix
- [ ] No generic names: `HelperService`, `UtilityService`, `ManagerService`, `CommonService`
- [ ] Namespace is `App\Services\{Domain}\{Entity}Service`
- [ ] Domain subdirectories used when 20+ service files exist
- [ ] Method names are business verbs, not HTTP verbs (`register()` not `store()`)
- [ ] Method names do not repeat the entity name (`$order->place()` not `$order->placeOrder()`)

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
- Name Service Classes and Methods by Convention
### Decision Trees (from 07)
- Entity-Oriented Names vs Capability-Oriented Names
- Business Verb Methods vs HTTP Verb Methods
- Domain Subdirectories vs Flat Service Directory
- Service Suffix vs Abstract/Manager/Helper Names
### Related Rules (from 06 skills)
- **Rule 1**: Use `{Entity}Service` Class Naming Pattern
- **Rule 2**: Use Business Verbs, Not HTTP Verbs, for Method Names
- **Rule 3**: Do Not Repeat the Entity Name in Method Names
- **Rule 4**: Use Domain Subdirectories When Exceeding 20 Service Files
- **Rule 5**: Avoid Generic or Ambiguous Service Names
- **Rule 6**: Namespace Services Under `App\Services`
- **Rule 7**: Maintain Consistent Naming Across the Team
### Related Skills (from 06 skills)
- Design Service Class
- Classify Service as Application or Domain Service

