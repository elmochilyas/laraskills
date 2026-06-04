# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 01InternalDeveloperPlatforms
**Knowledge Unit:** ServiceCatalogPatterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] catalog-info.yaml exists in every Laravel repository
- [ ] Schema starts with 3-5 core fields; expanded based on demand
- [ ] Auto-discovery and auto-registration implemented
- [ ] Lifecycle states with documented transition requirements
- [ ] Health signals automated for all production services
- [ ] Vulnerability scanning integrated
- [ ] Catalog queryable via CLI or integrated tools
- [ ] Quarterly ownership review cycle established

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Storage Backend:** YAML files in repositories for small orgs (< 20 services). Backstage catal...
- [ ] Architecture guideline: - **Metadata Format:** Use Backstage entity spec for interoperability (even without Backstage its...
- [ ] Architecture guideline: - **Ownership Model:** Team ownership with individual as secondary contact. Team ownership provid...
- [ ] Architecture guideline: - **Registration Process:** CI auto-registration for new services. Manual PR review for metadata ...
- [ ] Architecture guideline: - **Health Signals:** Aggregate CI status, deploy frequency, test coverage, and Pulse metrics. Au...
- [ ] Architecture guideline: - **Discovery Integration:** Integrate catalog into existing toolsâ€”IDE, CLI, PR workflow. Devel...
- [ ] Decision: Should We Implement a Service Catalog? - ensure correct choice is made
- [ ] Decision: Storage Backend â€” YAML vs Backstage vs Custom? - ensure correct choice is made
- [ ] Decision: Metadata Breadth â€” Minimal vs Comprehensive? - ensure correct choice is made
- [ ] Decision: Registration â€” Automated vs Manual? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement a Service Catalog for Laravel Applications
- [ ] Skill applied: Implement Catalog-Driven Governance for Laravel Services

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
- [ ] catalog-info.yaml exists in every Laravel repository
- [ ] Schema starts with 3-5 core fields; expanded based on demand
- [ ] Auto-discovery and auto-registration implemented
- [ ] Lifecycle states with documented transition requirements
- [ ] Health signals automated for all production services
- [ ] Vulnerability scanning integrated
- [ ] Catalog queryable via CLI or integrated tools

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Database-Backed Catalog -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Static Spreadsheet -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Incomplete Catalog -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Orphan Graveyard -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Manual Catalog Maintenance
- [ ] Avoid mistake: Too Much Metadata Too Soon
- [ ] Avoid mistake: Catalog Without Discovery
- [ ] Avoid mistake: Ignoring Ownership Drift

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
- Implement a Service Catalog for Laravel Applications
- Implement Catalog-Driven Governance for Laravel Services
### Decision Trees (from 07)
- Should We Implement a Service Catalog?
- Storage Backend â€” YAML vs Backstage vs Custom?
- Metadata Breadth â€” Minimal vs Comprehensive?
- Registration â€” Automated vs Manual?
### Anti-Patterns (from 08)
- The Database-Backed Catalog
- The Static Spreadsheet
- The Incomplete Catalog
- The Orphan Graveyard
### Common Mistakes (from 04)
- Manual Catalog Maintenance
- Too Much Metadata Too Soon
- Catalog Without Discovery
- Ignoring Ownership Drift
### Related Skills (from 06 skills)
- Integrate Backstage as a Developer Portal for Laravel
- Architect IDP Patterns for Laravel Teams
- Design Golden Paths for Laravel Development

