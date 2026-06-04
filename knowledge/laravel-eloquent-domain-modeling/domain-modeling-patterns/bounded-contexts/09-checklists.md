# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Bounded Contexts
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Organize Code by Business Capability, Not Technical Layer
- [ ] Enforce: Never Share Database Tables Across Bounded Contexts
- [ ] Enforce: Communicate Between Contexts Only Through Events or APIs
- [ ] Enforce: Implement an Anti-Corruption Layer When Integrating with External Contexts
- [ ] Enforce: Each Bounded Context Must Have Its Own Policies and Authorization Rules
- [ ] Enforce: Use Context Maps to Document Inter-Context Relationships
- [ ] Enforce: Never Import Models from Another Bounded Context
- [ ] Performance: - Inter-context communication adds latency (API call vs direct method call)
- [ ] Performance: - Event-driven communication between contexts is naturally async â€” plan for...
- [ ] Performance: - Shared database schemas between contexts create coupling that hurts perform...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Organize by directory: `app/Contexts/{ContextName}/`
- [ ] Architecture guideline: - Each context has its own Models, Controllers, Policies, and migrations
- [ ] Architecture guideline: - Cross-context communication uses events or a service API layer
- [ ] Architecture guideline: - An ACL translates between contexts when sharing data

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Organize Code by Business Capability, Not Technical Layer
- [ ] Apply rule: Never Share Database Tables Across Bounded Contexts
- [ ] Apply rule: Communicate Between Contexts Only Through Events or APIs
- [ ] Apply rule: Implement an Anti-Corruption Layer When Integrating with External Contexts
- [ ] Apply rule: Each Bounded Context Must Have Its Own Policies and Authorization Rules
- [ ] Apply rule: Use Context Maps to Document Inter-Context Relationships
- [ ] Apply rule: Never Import Models from Another Bounded Context

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Inter-context communication adds latency (API call vs direct method call)
- [ ] - Event-driven communication between contexts is naturally async â€” plan for eventual consistency
- [ ] - Shared database schemas between contexts create coupling that hurts performance at scale

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
- Organize Code by Business Capability, Not Technical Layer
- Never Share Database Tables Across Bounded Contexts
- Communicate Between Contexts Only Through Events or APIs
- Implement an Anti-Corruption Layer When Integrating with External Contexts
- Each Bounded Context Must Have Its Own Policies and Authorization Rules
- Use Context Maps to Document Inter-Context Relationships
- Never Import Models from Another Bounded Context

