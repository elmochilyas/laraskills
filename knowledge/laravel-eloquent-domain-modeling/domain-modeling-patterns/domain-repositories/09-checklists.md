# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Domain Repositories
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Design Repository Interfaces Around Domain Concepts
- [ ] Enforce: One Repository per Aggregate Root, Not per Entity
- [ ] Enforce: Never Manage Transactions Inside Repositories
- [ ] Enforce: Return Domain Objects or Collections, Never Query Builders
- [ ] Enforce: Keep Repository Interface Free of Eloquent-Specific Types
- [ ] Enforce: Prefer Direct Eloquent Usage Over Repositories for Simple CRUD
- [ ] Enforce: Make Repository Methods Explicit About Their Query Intent
- [ ] Performance: - Repository methods add a single method call â€” negligible overhead
- [ ] Performance: - Strategies like eager loading should be explicit in repository methods
- [ ] Performance: - Caching decorators can wrap repositories without changing interfaces

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Repository interfaces in the domain layer (or `App\Contracts\Repositories\*`)
- [ ] Architecture guideline: - Implementations in the infrastructure layer (`App\Repositories\*`)
- [ ] Architecture guideline: - Repository methods return domain objects or collections
- [ ] Architecture guideline: - Repository interface contains no Eloquent-specific types

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Design Repository Interfaces Around Domain Concepts
- [ ] Apply rule: One Repository per Aggregate Root, Not per Entity
- [ ] Apply rule: Never Manage Transactions Inside Repositories
- [ ] Apply rule: Return Domain Objects or Collections, Never Query Builders
- [ ] Apply rule: Keep Repository Interface Free of Eloquent-Specific Types
- [ ] Apply rule: Prefer Direct Eloquent Usage Over Repositories for Simple CRUD
- [ ] Apply rule: Make Repository Methods Explicit About Their Query Intent

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Repository methods add a single method call â€” negligible overhead
- [ ] - Strategies like eager loading should be explicit in repository methods
- [ ] - Caching decorators can wrap repositories without changing interfaces

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
- Design Repository Interfaces Around Domain Concepts
- One Repository per Aggregate Root, Not per Entity
- Never Manage Transactions Inside Repositories
- Return Domain Objects or Collections, Never Query Builders
- Keep Repository Interface Free of Eloquent-Specific Types
- Prefer Direct Eloquent Usage Over Repositories for Simple CRUD
- Make Repository Methods Explicit About Their Query Intent

