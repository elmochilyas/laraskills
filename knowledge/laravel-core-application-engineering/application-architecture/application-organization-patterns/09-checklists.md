# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture & Structure
**Knowledge Unit:** Application Organization Patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] ADR documents model count, team size, bounded contexts, chosen pattern, and rationale
- [ ] Bounded contexts are explicitly mapped before any restructuring
- [ ] Pattern selection follows the decision framework (model count â†’ bounded contexts â†’ team size)
- [ ] Chosen pattern is applied consistently to all application files
- [ ] Team members have reviewed and agreed on the decision
- [ ] PSR-4 autoloading configuration is updated if pattern requires custom namespaces
- [ ] Artisan compatibility considerations are documented

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Pattern Selection Decision Framework
- [ ] Architecture guideline: Project model count?
- [ ] Architecture guideline: â”œâ”€â”€ <20 â†’ Technical-layer
- [ ] Architecture guideline: â”œâ”€â”€ 20-50 â†’ Does the app have distinct bounded contexts?
- [ ] Architecture guideline: â”‚   â”œâ”€â”€ Yes â†’ Domain-driven
- [ ] Architecture guideline: â”‚   â””â”€â”€ No â†’ Technical or Hybrid
- [ ] Architecture guideline: â””â”€â”€ 50+ â†’ Multiple teams?
- [ ] Architecture guideline: â”œâ”€â”€ Yes â†’ Modular (module per team)
- [ ] Architecture guideline: â””â”€â”€ No â†’ Domain-driven with sub-features
- [ ] Architecture guideline: ### Comparison Matrix
- [ ] Architecture guideline: ### Pattern Selection Based on Team Size
- [ ] Decision: Organizational Pattern Selection - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Select and Document Organizational Pattern
- [ ] Skill applied: Migrate Application Between Organizational Patterns

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
- [ ] ADR documents model count, team size, bounded contexts, chosen pattern, and rationale
- [ ] Bounded contexts are explicitly mapped before any restructuring
- [ ] Pattern selection follows the decision framework (model count â†’ bounded contexts â†’ team size)
- [ ] Chosen pattern is applied consistently to all application files
- [ ] Team members have reviewed and agreed on the decision
- [ ] PSR-4 autoloading configuration is updated if pattern requires custom namespaces
- [ ] Artisan compatibility considerations are documented

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Premature Domain Organization -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Mixed Organizational Signals -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Modular Over-Engineering -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Shared Kernel Bloat -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern

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
- Select and Document Organizational Pattern
- Migrate Application Between Organizational Patterns
### Decision Trees (from 07)
- Organizational Pattern Selection
- Migration Timing (When to Restructure)
- Boundary Enforcement Strategy
### Anti-Patterns (from 08)
- Premature Domain Organization
- Mixed Organizational Signals
- Modular Over-Engineering
- Shared Kernel Bloat
### Related Rules (from 06 skills)
- Start with Technical-Layer, Evolve When Complexity Demands It (05-rules.md)
- Define Bounded Contexts Before Restructuring (05-rules.md)
- Never Mix Organizational Patterns (05-rules.md)
- Enforce Domain Boundaries with Automated Checks (05-rules.md)
- Keep Shared Kernel Minimal (05-rules.md)
- Do Not Use Modular Organization for Single-Team Applications (05-rules.md)
- Document Organizational Pattern Decisions (05-rules.md)
### Related Skills (from 06 skills)
- Skill: Migrate Application Between Organizational Patterns
- Skill: Establish Directory Conventions
- Skill: Organize Service Providers by Domain

