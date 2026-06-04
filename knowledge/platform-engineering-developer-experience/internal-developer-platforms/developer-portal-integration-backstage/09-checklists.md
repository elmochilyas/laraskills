# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 01InternalDeveloperPlatforms
**Knowledge Unit:** DeveloperPortalIntegrationBackstage
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] All Laravel services registered in catalog with `catalog-info.yaml`
- [ ] TechDocs renders documentation from at least 3 services
- [ ] Scaffolder templates create working Laravel projects with CI and Forge configuration
- [ ] Authentication integrated with org IdP (SSO)
- [ ] RBAC scopes scaffolder and deployment actions by role
- [ ] Upgrade process documented; staging instance tests upgrades before production

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Deployment Model:** Self-host Backstage for customization (Kubernetes cluster, PostgreSQL). U...
- [ ] Architecture guideline: - **Plugin Architecture:** Frontend-only plugins for dashboards and displays. Full plugins (front...
- [ ] Architecture guideline: - **Catalog Registration:** Auto-discovery via Git provider for existing repositories. Manual YAM...
- [ ] Architecture guideline: - **Scaffolder Templates:** Parameterize project name, PHP version, starter kit, database type, s...
- [ ] Architecture guideline: - **TechDocs Build:** CI pipeline converts /docs folder Markdown to Backstage-compatible HTML. Us...
- [ ] Architecture guideline: - **Authentication:** Integrate with organization's identity provider (GitHub OAuth, Okta, Azure ...
- [ ] Decision: Should We Adopt Backstage? - ensure correct choice is made
- [ ] Decision: Self-Hosted vs Managed Backstage? - ensure correct choice is made
- [ ] Decision: Scaffolder-First vs Catalog-First? - ensure correct choice is made
- [ ] Decision: Plugin Depth â€” Thin vs Deep? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Integrate Backstage as a Developer Portal for Laravel
- [ ] Skill applied: Build a Laravel-Specific Backstage Scaffolder Template

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
- [ ] All Laravel services registered in catalog with `catalog-info.yaml`
- [ ] TechDocs renders documentation from at least 3 services
- [ ] Scaffolder templates create working Laravel projects with CI and Forge configuration
- [ ] Authentication integrated with org IdP (SSO)
- [ ] RBAC scopes scaffolder and deployment actions by role
- [ ] Upgrade process documented; staging instance tests upgrades before production

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Empty Portal -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Mandatory Portal -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Backstage Black Hole -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Custom Plugin Graveyard -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Under-Documenting the Catalog
- [ ] Avoid mistake: Building Before Understanding Needs
- [ ] Avoid mistake: Over-Customizing the UI
- [ ] Avoid mistake: Ignoring Template Decay

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
- Integrate Backstage as a Developer Portal for Laravel
- Build a Laravel-Specific Backstage Scaffolder Template
### Decision Trees (from 07)
- Should We Adopt Backstage?
- Self-Hosted vs Managed Backstage?
- Scaffolder-First vs Catalog-First?
- Plugin Depth â€” Thin vs Deep?
### Anti-Patterns (from 08)
- The Empty Portal
- The Mandatory Portal
- The Backstage Black Hole
- The Custom Plugin Graveyard
### Common Mistakes (from 04)
- Under-Documenting the Catalog
- Building Before Understanding Needs
- Over-Customizing the UI
- Ignoring Template Decay
### Related Skills (from 06 skills)
- Architect IDP Patterns for Laravel Teams
- Implement Service Catalog Patterns for Laravel
- Build a Forge-Based Self-Service Provisioning Platform

