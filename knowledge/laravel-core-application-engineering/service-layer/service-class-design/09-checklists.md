# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Service Layer Pattern
**Knowledge Unit:** Service Class Design
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Make Services Stateless
- [ ] Verify: Keep Constructor Dependencies Under 8
- [ ] Verify: Name Methods as Operations, Not HTTP Actions
- [ ] Verify: Return Typed Results
- [ ] Service name follows `{Entity}Service` or `{Capability}Service` pattern
- [ ] Service is organized around one entity or capability, not a technical layer
- [ ] Constructor has 8 or fewer dependencies
- [ ] All dependencies injected via constructor (no `app()` or `resolve()` in methods)
- [ ] Method names are business verbs, not HTTP verbs
- [ ] Every method has explicit return type declaration
- [ ] No `mixed` or untyped `array` return types for structured data
- [ ] No HTTP dependencies injected (`Request`, `Response`, `Session`)
- [ ] Service is stateless â€” no mutable properties set during execution
- [ ] Service has fewer than 15-20 public methods (or split plan exists)
- [ ] Complex operations are extracted to action classes

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Service Structure
- [ ] Architecture guideline: class OrderService
- [ ] Architecture guideline: public function __construct(
- [ ] Architecture guideline: private OrderRepository $orders,
- [ ] Architecture guideline: private InventoryService $inventory,
- [ ] Architecture guideline: public function place(Cart $cart, User $user): Order { /* ... */ }
- [ ] Architecture guideline: public function cancel(Order $order): void { /* ... */ }
- [ ] Architecture guideline: public function ship(Order $order): void { /* ... */ }
- [ ] Architecture guideline: ### Controller â†’ Service Flow
- [ ] Architecture guideline: Controller â†’ extracts data from request â†’ calls service method
- [ ] Architecture guideline: Service â†’ performs operation â†’ returns result
- [ ] Architecture guideline: Controller â†’ formats result as HTTP response

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Make Services Stateless
- [ ] Best practice: Keep Constructor Dependencies Under 8
- [ ] Best practice: Name Methods as Operations, Not HTTP Actions
- [ ] Best practice: Return Typed Results
- [ ] Skill applied: Design a Service Class

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
- [ ] Service name follows `{Entity}Service` or `{Capability}Service` pattern
- [ ] Service is organized around one entity or capability, not a technical layer
- [ ] Constructor has 8 or fewer dependencies
- [ ] All dependencies injected via constructor (no `app()` or `resolve()` in methods)
- [ ] Method names are business verbs, not HTTP verbs
- [ ] Every method has explicit return type declaration
- [ ] No `mixed` or untyped `array` return types for structured data

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
- Design a Service Class
### Decision Trees (from 07)
- Entity-Oriented Services vs Capability-Oriented Services
- Stateless Service Design vs Mutable State on $this
- Constructor Injection vs Method Injection for Dependencies
- Single-Method Services vs Multi-Method Services
### Related Rules (from 06 skills)
- **Rule 1**: Services Must Be Stateless
- **Rule 2**: Limit Constructor Dependencies to 8
- **Rule 3**: Name Methods as Business Operations, Not HTTP Actions
- **Rule 4**: Return Typed Results from Every Method
- **Rule 5**: Split Services Beyond 15-20 Methods
- **Rule 6**: Never Inject HTTP Dependencies into Services
- **Rule 7**: Use Constructor Injection as the Primary DI Mechanism
- **Rule 8**: Group Services by Entity or Capability
### Related Skills (from 06 skills)
- Name Service Classes and Methods by Convention
- Classify Service as Application or Domain Service
- Design Stateless Service

