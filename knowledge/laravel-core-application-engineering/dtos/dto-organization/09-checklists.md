# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** DTO Organization
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] One organizational strategy is applied consistently across the entire project
- [ ] No DTOs exist in HTTP-related directories (`app/Http/Controllers/DTOs/`)
- [ ] Directory nesting does not exceed 4 levels from `app/`
- [ ] All DTOs use the same naming suffix (`Dto` or `Data`)
- [ ] No duplicate DTO class names exist
- [ ] Cross-domain shared DTOs are in a centralized location
- [ ] PHPStan level 6+ is configured to detect orphaned DTOs
- [ ] Team template exists for new DTO files

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Strategy selection by DTO count: < 15 â†’ centralized, 15-50 â†’ per-domain or per-operation, 5...
- [ ] Architecture guideline: - Naming convention: `UserDto`, `CreateUserDto`, `UserData` (pick one suffix per project)
- [ ] Architecture guideline: - Cross-domain shared DTOs in `app/DTOs/`, domain-specific DTOs in `app/Domains/{Domain}/DTOs/`
- [ ] Architecture guideline: - Standardize file structure with a team template (namespace, readonly class, construct, factorie...
- [ ] Architecture guideline: - Add orphan DTO detection to CI (PHPStan level 6 detects unused classes)
- [ ] Decision: Centralized vs Per-Domain vs Per-Operation Organization - ensure correct choice is made
- [ ] Decision: Dto vs Data Suffix Convention - ensure correct choice is made
- [ ] Decision: Hybrid Strategy for Large Applications - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Select and Apply a DTO Organizational Strategy

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
- [ ] One organizational strategy is applied consistently across the entire project
- [ ] No DTOs exist in HTTP-related directories (`app/Http/Controllers/DTOs/`)
- [ ] Directory nesting does not exceed 4 levels from `app/`
- [ ] All DTOs use the same naming suffix (`Dto` or `Data`)
- [ ] No duplicate DTO class names exist
- [ ] Cross-domain shared DTOs are in a centralized location
- [ ] PHPStan level 6+ is configured to detect orphaned DTOs

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Scattered DTOs (No Organizational Strategy) -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: DTOs in Controllers Directory -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Overly Deep Nesting (5+ Levels) -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The Inline DTO -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Duplicate DTO Names Across Domains -- apply preferred alternative
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
- Select and Apply a DTO Organizational Strategy
### Decision Trees (from 07)
- Centralized vs Per-Domain vs Per-Operation Organization
- Dto vs Data Suffix Convention
- Hybrid Strategy for Large Applications
### Anti-Patterns (from 08)
- Scattered DTOs (No Organizational Strategy)
- DTOs in Controllers Directory
- Overly Deep Nesting (5+ Levels)
- The Inline DTO
- Duplicate DTO Names Across Domains
### Related Rules (from 06 skills)
- Rule 1: Choose One Organizational Strategy and Apply It Consistently
- Rule 2: Never Place DTOs Inside HTTP-Related Directories
- Rule 3: Limit Directory Nesting to a Maximum of 4 Levels from `app/`
- Rule 4: Use a Consistent Suffix Across All DTO Classes
- Rule 5: Place Shared Cross-Domain DTOs in a Centralized Location
- Rule 6: Add Orphan DTO Detection to CI
### Related Skills (from 06 skills)
- DTO Fundamentals: Implement Baseline DTO
- Readonly Data Objects: Apply Readonly Enforcement to a DTO

