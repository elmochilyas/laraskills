# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 02-database-fulltext-search
**Knowledge Unit:** Scout Collection Engine
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Scout Collection Engine implementation follows 02-database-fulltext-search patterns
- [ ] All edge cases handled for Scout Collection Engine
- [ ] Full test coverage for Scout Collection Engine
- [ ] Security review completed for Scout Collection Engine
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Scout Collection Engine

---

# Architecture Checklist

- [ ] Set in `.env`: `SCOUT_DRIVER=collection` for local dev.
- [ ] For tests, use `Scout::fake()` which replaces the engine with a collection-like fake.
- [ ] Production config should use `database`, `meilisearch`, `typesense`, or `algolia`.
- [ ] The collection engine is essentially Scout without an external search backend.
- [ ] Evaluate: Database Engine vs Dedicated Search Engine
- [ ] Evaluate: Full-Text vs LIKE/Prefix Search
- [ ] Evaluate: Scout Database vs Collection Engine Selection

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Scout Collection Engine following 02-database-fulltext-search patterns
- [ ] Configure all required settings for Scout Collection Engine
- [ ] Register route/middleware/service for Scout Collection Engine
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Loads ALL searchable records from the database into memory on every search.
- [ ] Memory usage = number of records Ã— average record size. A 10,000 record model with 1KB average uses 10MB per search.
- [ ] Search time is O(n) â€” linear scan of all records.
- [ ] Not suitable for any dataset beyond trivial size.

---

# Security Checklist

- [ ] Validate all input - never trust client data
- [ ] Apply authorization checks for every operation
- [ ] Sanitize output to prevent injection attacks
- [ ] Rate limit exposed endpoints
- [ ] Log security-relevant events

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] SCOUT_DRIVER=collection in .env.local / phpunit.xml
- [ ] Production uses a real search engine
- [ ] Tests pass with both collection and production engines
- [ ] Write feature tests for happy path of Scout Collection Engine
- [ ] Write feature tests for validation failure of Scout Collection Engine
- [ ] Write feature tests for authentication failure of Scout Collection Engine
- [ ] Write unit tests for service/action/DTO classes
- [ ] Test edge cases: empty results, boundary values, null inputs

---

# Maintainability Checklist

- [ ] Follow PSR-12 coding standards
- [ ] Use type hints on all methods and properties
- [ ] Keep methods under 15 lines
- [ ] Use meaningful class and method names
- [ ] Add PHPDoc for public API methods

---

# Anti-Pattern Prevention Checklist

- [ ] Avoid tight coupling between layers
- [ ] Avoid business logic in controllers
- [ ] Avoid skipping validation layers

---

# Production Readiness Checklist

- [ ] Add structured logging for all operations
- [ ] Configure monitoring alerts for error rate spikes
- [ ] Implement health check endpoint
- [ ] Document rollback procedure
- [ ] Set up error tracking integration
- [ ] Configure proper CORS for production

---

# Final Approval Checklist

- [ ] Architecture checklist complete
- [ ] Security checklist complete
- [ ] Performance checklist complete
- [ ] Testing checklist complete
- [ ] Anti-pattern prevention checklist complete
- [ ] Production readiness checklist complete
- [ ] All items resolved before merge

---

# Related Knowledge

### Rules
- Never Use Collection Engine in Production
- Test with the Production Engine, Not Just Collection
- Configure Per Environment in .env Files

### Decisions
- Database Engine vs Dedicated Search Engine
- Full-Text vs LIKE/Prefix Search
- Scout Database vs Collection Engine Selection

## Related Knowledge
- K002 (Scout database engine)
- K001 (Searchable trait)



