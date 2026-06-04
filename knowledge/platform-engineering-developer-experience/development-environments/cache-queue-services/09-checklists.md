# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** development-environments
**Knowledge Unit:** cache-queue-services
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Redis container running and accessible
- [ ] Separate DB indexes for cache, queue, sessions
- [ ] phpredis extension loaded (`php -m | grep redis`)
- [ ] Cache operations succeed (store/retrieve/forget)
- [ ] Queue jobs process correctly (dispatch/worker/complete)
- [ ] Session data persists across requests
- [ ] Graceful fallback when Redis is unavailable
- [ ] Performance: - Redis ops: <1ms per operation (same machine)
- [ ] Performance: - Queue throughput limited by PHP worker speed, not Redis
- [ ] Performance: - Memory: 10-50MB typical dev Redis instance

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Use different queue connection names per environment (not same name with different configs)
- [ ] Architecture guideline: - Handle Redis connection failures gracefully â€” fall back to file cache
- [ ] Architecture guideline: - Configure health checks in docker-compose.yml
- [ ] Architecture guideline: - For production-matching dev, use same Redis version

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Cache and Queue Services in Laravel Dev

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Redis ops: <1ms per operation (same machine)
- [ ] - Queue throughput limited by PHP worker speed, not Redis
- [ ] - Memory: 10-50MB typical dev Redis instance
- [ ] - Persistence disabled = zero overhead in development

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - No authentication on Redis in Sail (no `requirepass`)
- [ ] - Use array cache + sync queue in testing for isolation
- [ ] - For shared dev environments, add Redis password

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
- [ ] Redis container running and accessible
- [ ] Separate DB indexes for cache, queue, sessions
- [ ] phpredis extension loaded (`php -m | grep redis`)
- [ ] Cache operations succeed (store/retrieve/forget)
- [ ] Queue jobs process correctly (dispatch/worker/complete)
- [ ] Session data persists across requests
- [ ] Graceful fallback when Redis is unavailable

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: File cache in multi-container setups -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring queue worker -- apply preferred alternative
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
- Configure Cache and Queue Services in Laravel Dev
### Anti-Patterns (from 08)
- File cache in multi-container setups
- Ignoring queue worker
### Related Rules (from 06 skills)
- CACHEQ-RULE-001: Separate Redis DB indexes
- CACHEQ-RULE-002: Use phpredis extension
- CACHEQ-RULE-003: Disable persistence in development
- CACHEQ-RULE-004: Start queue worker
- CACHEQ-RULE-005: Valkey as drop-in
### Related Skills (from 06 skills)
- Configure Laravel Sail
- Set Up Docker Compose for Laravel
- Configure Database Services

