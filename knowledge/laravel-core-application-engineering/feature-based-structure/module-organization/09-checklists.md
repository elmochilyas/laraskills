# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Bounded Contexts
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Feature root directory follows PascalCase naming
- [ ] Subdirectory names follow consistent casing: `Controllers/`, not `controllers/` or `http/`
- [ ] Only directories with files are created â€” no empty directories
- [ ] Maximum nesting depth of 3 levels or less
- [ ] Service provider uses `__DIR__.'/../'` relative paths â€” no hardcoded paths
- [ ] Routes use fully qualified class names for controllers
- [ ] Route prefixes are unique across all features
- [ ] View namespace matches feature name convention: `feature_name::`
- [ ] Models have explicit `$table` property with feature prefix
- [ ] Migrations co-located at `Database/Migrations/` if applicable

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Controllers in features resolve the same way as top-level controllers â€” use fully qualified c...
- [ ] Architecture guideline: - Models use standard Eloquent table naming conventions (snake_case plural of class name)
- [ ] Architecture guideline: - View namespacing: `$this->loadViewsFrom(__DIR__.'/../views', 'billing')` enables `billing::invo...
- [ ] Architecture guideline: - Factories co-located at `Features/{Feature}/Database/Factories/`
- [ ] Architecture guideline: - Migrations co-located at `Features/{Feature}/Database/Migrations/`
- [ ] Architecture guideline: - Tests in `tests/Features/{Feature}/` mirroring the source structure
- [ ] Architecture guideline: - Subdirectory names must be consistent across features (case-sensitive)
- [ ] Decision: Standard Subdirectory List for Each Feature (What Goes In) - ensure correct choice is made
- [ ] Decision: Consistent Naming Convention for Feature Subdirectories - ensure correct choice is made
- [ ] Decision: Subdirectory Inclusion (Always Create All vs Create on Demand) - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create A New Feature With Consistent Directory Structure
- [ ] Skill applied: Enforce Feature Structure Conventions With CI

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
- [ ] Feature root directory follows PascalCase naming
- [ ] Subdirectory names follow consistent casing: `Controllers/`, not `controllers/` or `http/`
- [ ] Only directories with files are created â€” no empty directories
- [ ] Maximum nesting depth of 3 levels or less
- [ ] Service provider uses `__DIR__.'/../'` relative paths â€” no hardcoded paths
- [ ] Routes use fully qualified class names for controllers
- [ ] Route prefixes are unique across all features

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
- Create A New Feature With Consistent Directory Structure
- Enforce Feature Structure Conventions With CI
### Decision Trees (from 07)
- Standard Subdirectory List for Each Feature (What Goes In)
- Consistent Naming Convention for Feature Subdirectories
- Subdirectory Inclusion (Always Create All vs Create on Demand)
### Related Rules (from 06 skills)
- Maintain Consistent Feature Directory Structure (05-rules.md)
- Only Create Directories When Needed (05-rules.md)
- Keep Nesting Shallow â€” Maximum 3 Levels (05-rules.md)
- Align View Namespace With Feature Name (05-rules.md)
- Co-locate Migrations Within The Feature (05-rules.md)
- Keep Feature Files In Correct Subdirectories (05-rules.md)
- Use Fully Qualified Class Names In Routes (05-rules.md)
- Use A Feature Scaffold Command (05-rules.md)
### Related Skills (from 06 skills)
- Create A New Feature Scaffold (feature-foundations)
- Enforce Feature Structure Conventions With CI
- Create Feature Service Provider

