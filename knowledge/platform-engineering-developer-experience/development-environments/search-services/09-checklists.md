# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** development-environments
**Knowledge Unit:** search-services
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Meilisearch/Typesense container running and accessible
- [ ] Laravel Scout installed and configured with correct driver
- [ ] `Searchable` trait added to relevant models
- [ ] `toSearchableArray()` defined on searchable models
- [ ] `scout:import` completes successfully
- [ ] Search queries return correct results
- [ ] Queue-based indexing working (if `SCOUT_QUEUE=true`)
- [ ] Production search engine matches dev engine
- [ ] Performance: - Scout import: 500 records/batch default; increase for large datasets
- [ ] Performance: - Meilisearch memory: 50-100MB for 10k documents
- [ ] Performance: - Query latency: <50ms for indexes under 100k documents

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Install Scout + Meilisearch PHP SDK via Composer
- [ ] Architecture guideline: - Add `Searchable` trait to models; implement `toSearchableArray()` for index data
- [ ] Architecture guideline: - Configure `SCOUT_DRIVER=meilisearch` in .env
- [ ] Architecture guideline: - Add Meilisearch as Sail service via `--with=meilisearch`
- [ ] Architecture guideline: - Use faceted search with `->where()` filters

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Search Services (Meilisearch/Typesense)

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Scout import: 500 records/batch default; increase for large datasets
- [ ] - Meilisearch memory: 50-100MB for 10k documents
- [ ] - Query latency: <50ms for indexes under 100k documents
- [ ] - Index throughput: 100+ additions/second on dev machine

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Meilisearch master key must be secret in production
- [ ] - Sail auto-generates key; production should use strong managed key
- [ ] - Restrict network access to search engine port

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
- [ ] Meilisearch/Typesense container running and accessible
- [ ] Laravel Scout installed and configured with correct driver
- [ ] `Searchable` trait added to relevant models
- [ ] `toSearchableArray()` defined on searchable models
- [ ] `scout:import` completes successfully
- [ ] Search queries return correct results
- [ ] Queue-based indexing working (if `SCOUT_QUEUE=true`)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Using Sail Meilisearch in production -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring search in CI -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern

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
- Configure Search Services (Meilisearch/Typesense)
### Anti-Patterns (from 08)
- Using Sail Meilisearch in production
- Ignoring search in CI
### Related Rules (from 06 skills)
- SEARCH-RULE-001: Use queue-based indexing
- SEARCH-RULE-002: Import after adding Searchable
- SEARCH-RULE-003: Configure filterable attributes
- SEARCH-RULE-004: Use Docker service hostname
- SEARCH-RULE-005: Persist master key
### Related Skills (from 06 skills)
- Configure Laravel Sail
- Set Up Docker Compose for Laravel
- Configure Cache and Queue Services

