# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Inter-Module Communication
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Interface lives in `app/Kernel/Contracts/` (not inside a feature)
- [ ] Consuming feature injects the interface, never the concrete class
- [ ] Owning feature's service provider binds interface to implementation
- [ ] No direct model imports across feature boundaries exist
- [ ] Contract test verifies interface behavior through container
- [ ] Dependency direction is documented and acyclic
- [ ] Interface is consumed by at least 2 features (YAGNI applies)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Service interfaces in `app/Kernel/Contracts/` with no implementation
- [ ] Architecture guideline: - DTOs in `app/Kernel/DTOs/` for safe cross-boundary data passing
- [ ] Architecture guideline: - Events in feature-specific `Events/` directories, listeners in consuming features
- [ ] Architecture guideline: - Event subscribers in a shared location or `AppServiceProvider` bridge features
- [ ] Architecture guideline: - Container binding wires interfaces to implementations across feature boundaries
- [ ] Architecture guideline: - CI step detects cross-feature model imports as a build failure
- [ ] Decision: Direct Model Access vs Service Interface for Cross-Feature Data - ensure correct choice is made
- [ ] Decision: Event Dispatching vs Direct Service Call for Side Effects - ensure correct choice is made
- [ ] Decision: Shared Kernel Contract vs Duplicated Type Per Feature - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Define Cross-Feature Communication Contracts
- [ ] Skill applied: Implement Event-Based Cross-Feature Communication
- [ ] Skill applied: Wire Cross-Feature Dependencies In Service Providers

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
- [ ] Interface lives in `app/Kernel/Contracts/` (not inside a feature)
- [ ] Consuming feature injects the interface, never the concrete class
- [ ] Owning feature's service provider binds interface to implementation
- [ ] No direct model imports across feature boundaries exist
- [ ] Contract test verifies interface behavior through container
- [ ] Dependency direction is documented and acyclic
- [ ] Interface is consumed by at least 2 features (YAGNI applies)

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
- Define Cross-Feature Communication Contracts
- Implement Event-Based Cross-Feature Communication
- Wire Cross-Feature Dependencies In Service Providers
### Decision Trees (from 07)
- Direct Model Access vs Service Interface for Cross-Feature Data
- Event Dispatching vs Direct Service Call for Side Effects
- Shared Kernel Contract vs Duplicated Type Per Feature
### Related Rules (from 06 skills)
- Never Direct Model Access Across Features (05-rules.md)
- Use Service Interfaces For Data Retrieval (05-rules.md)
- Use Events For Cross-Cutting Side Effects (05-rules.md)
- Use DTOs For Cross-Boundary Data (05-rules.md)
- Wire Cross-Feature Dependencies In Providers (05-rules.md)
- Use Contract Tests For Interfaces (05-rules.md)
- Keep Shared Kernel Lean (05-rules.md)
### Related Skills (from 06 skills)
- Create Feature Service Provider
- Implement Event-Based Cross-Feature Communication
- Evaluate Organizational Structure (feature-vs-layer)

