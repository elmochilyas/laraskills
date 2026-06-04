# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Custom Exceptions
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Use Typed Exception Classes Instead of Generic Exceptions with String Codes
- [ ] Enforce: Always Include Structured Context Data as Public Readonly Properties
- [ ] Enforce: Create a Domain Base Exception for Grouping Related Errors
- [ ] Enforce: Use Public Readonly Properties, Never Getters for Context Data
- [ ] Enforce: Name Exceptions Descriptively â€” What Failed, Not Where
- [ ] Enforce: Never Include Sensitive Data in Exception Properties
- [ ] Enforce: Register a renderable() or Implement render() for Every Custom Exception
- [ ] Enforce: Namespace Custom Exceptions by Domain for Larger Applications
- [ ] Enforce: Keep Exception Messages User-Friendly When User-Facing
- [ ] Exception class name describes what went wrong (PaymentFailedException, not UserServiceException)
- [ ] Properties are `public readonly` and typed (no private getters, no stringly-typed context)
- [ ] Message is user-friendly if user-facing; technical details are in structured properties
- [ ] No sensitive data (passwords, tokens, PII) in properties or message
- [ ] Domain base exception exists when 3+ related types are present
- [ ] Namespace is domain-appropriate for the application size
- [ ] `renderable()` callback or `render()` method exists (for HTTP-rendered exceptions)
- [ ] A `report()` or `reportable()` path exists for logging

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Name exceptions clearly: `PaymentFailedException` not `PaymentException` (too vague)
- [ ] Architecture guideline: - Include relevant context in the constructor: user ID, amount, SKU, etc.
- [ ] Architecture guideline: - Keep the message user-friendly if displayed to end users
- [ ] Architecture guideline: - Create a base exception per domain for grouping (`BillingException`, `InventoryException`)
- [ ] Architecture guideline: - Namespace by domain for larger apps: `App\Exceptions\Billing\PaymentFailedException`
- [ ] Decision: Custom Exception vs Plain ValidationException for Business Rules - ensure correct choice is made
- [ ] Decision: Single Exception Class vs Exception Hierarchy per Domain - ensure correct choice is made
- [ ] Decision: Custom Exception with Report Method vs Separate Listener - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Use Typed Exception Classes Instead of Generic Exceptions with String Codes
- [ ] Apply rule: Always Include Structured Context Data as Public Readonly Properties
- [ ] Apply rule: Create a Domain Base Exception for Grouping Related Errors
- [ ] Apply rule: Use Public Readonly Properties, Never Getters for Context Data
- [ ] Apply rule: Name Exceptions Descriptively â€” What Failed, Not Where
- [ ] Apply rule: Never Include Sensitive Data in Exception Properties
- [ ] Apply rule: Register a renderable() or Implement render() for Every Custom Exception
- [ ] Apply rule: Namespace Custom Exceptions by Domain for Larger Applications
- [ ] Apply rule: Keep Exception Messages User-Friendly When User-Facing
- [ ] Skill applied: Create a Typed Custom Exception Class
- [ ] Skill applied: Register Custom Exception Rendering and Reporting

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
- [ ] Exception class name describes what went wrong (PaymentFailedException, not UserServiceException)
- [ ] Properties are `public readonly` and typed (no private getters, no stringly-typed context)
- [ ] Message is user-friendly if user-facing; technical details are in structured properties
- [ ] No sensitive data (passwords, tokens, PII) in properties or message
- [ ] Domain base exception exists when 3+ related types are present
- [ ] Namespace is domain-appropriate for the application size
- [ ] `renderable()` callback or `render()` method exists (for HTTP-rendered exceptions)

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
- Use Typed Exception Classes Instead of Generic Exceptions with String Codes
- Always Include Structured Context Data as Public Readonly Properties
- Create a Domain Base Exception for Grouping Related Errors
- Use Public Readonly Properties, Never Getters for Context Data
- Name Exceptions Descriptively â€” What Failed, Not Where
- Never Include Sensitive Data in Exception Properties
- Register a renderable() or Implement render() for Every Custom Exception
- Namespace Custom Exceptions by Domain for Larger Applications
- Keep Exception Messages User-Friendly When User-Facing
### Skills (from 06)
- Create a Typed Custom Exception Class
- Register Custom Exception Rendering and Reporting
### Decision Trees (from 07)
- Custom Exception vs Plain ValidationException for Business Rules
- Single Exception Class vs Exception Hierarchy per Domain
- Custom Exception with Report Method vs Separate Listener
### Related Rules (from 06 skills)
- Use Typed Exception Classes Instead of Generic Exceptions with String Codes
- Always Include Structured Context Data as Public Readonly Properties
- Create a Domain Base Exception for Grouping Related Errors
- Use Public Readonly Properties, Never Getters for Context Data
- Name Exceptions Descriptively â€” What Failed, Not Where
- Never Include Sensitive Data in Exception Properties
- Register a renderable() or Implement render() for Every Custom Exception
- Keep Exception Messages User-Friendly When User-Facing
### Related Skills (from 06 skills)
- Configure the Exception Handler (exception-fundamentals)

