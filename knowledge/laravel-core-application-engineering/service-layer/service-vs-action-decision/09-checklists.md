# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Service Layer Pattern
**Knowledge Unit:** Service vs Action Decision
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Don't Choose One Exclusively
- [ ] Verify: Start with Services, Extract Actions
- [ ] Verify: Use Actions Inside Services
- [ ] Multi-step workflows are in service orchestration methods, not actions
- [ ] Complex operations (30+ lines) are extracted to action classes
- [ ] Operations called from multiple entry points are in action classes
- [ ] Operations sharing dependencies with others are grouped in a service
- [ ] No action class calls or depends on a service class
- [ ] No service class exceeds 15 methods (extract to actions where needed)
- [ ] The decision is documented if unusual (e.g., action kept in service for team convention)
- [ ] Both patterns coexist in the codebase â€” not exclusively one or the other

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Decision: Service Pattern vs Action Pattern for Business Logic Organization - ensure correct choice is made
- [ ] Decision: Starting with Services vs Starting with Actions - ensure correct choice is made
- [ ] Decision: Service-Only vs Action-Only vs Combined Approach - ensure correct choice is made
- [ ] Decision: Action Calling Services vs Service Calling Actions - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Don't Choose One Exclusively
- [ ] Best practice: Start with Services, Extract Actions
- [ ] Best practice: Use Actions Inside Services
- [ ] Skill applied: Decide Between a Service Class and an Action Class

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
- [ ] Multi-step workflows are in service orchestration methods, not actions
- [ ] Complex operations (30+ lines) are extracted to action classes
- [ ] Operations called from multiple entry points are in action classes
- [ ] Operations sharing dependencies with others are grouped in a service
- [ ] No action class calls or depends on a service class
- [ ] No service class exceeds 15 methods (extract to actions where needed)
- [ ] The decision is documented if unusual (e.g., action kept in service for team convention)

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
- Decide Between a Service Class and an Action Class
### Decision Trees (from 07)
- Service Pattern vs Action Pattern for Business Logic Organization
- Starting with Services vs Starting with Actions
- Service-Only vs Action-Only vs Combined Approach
- Action Calling Services vs Service Calling Actions
### Related Rules (from 06 skills)
- **Rule 1**: Use Services and Actions Complementarily
- **Rule 2**: Default to Services, Extract to Actions
- **Rule 3**: Services May Call Actions; Actions Must Not Call Services
- **Rule 4**: Use Actions for Single Complex or Reused Operations
- **Rule 5**: Use Services for Related Operations with Shared Dependencies
- **Rule 6**: Split Services with 15+ Methods
- **Rule 7**: Use Actions Inside Services for Orchestration
### Related Skills (from 06 skills)
- Design a Service Class
- Orchestrate a Multi-Step Workflow in a Service Method

