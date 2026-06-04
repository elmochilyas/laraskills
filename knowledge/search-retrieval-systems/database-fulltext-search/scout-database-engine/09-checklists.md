# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 02-database-fulltext-search
**Knowledge Unit:** Scout Database Engine
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Scout Database Engine implementation follows 02-database-fulltext-search patterns
- [ ] All edge cases handled for Scout Database Engine
- [ ] Full test coverage for Scout Database Engine
- [ ] Security review completed for Scout Database Engine
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Scout Database Engine

---

# Architecture Checklist

- [ ] Set `SCOUT_DRIVER=database` in `.env`.
- [ ] Add `SearchUsingFullText` attribute to model columns that need full-text search.
- [ ] Add `SearchUsingPrefix` attribute for identifier columns (emails, SKUs).
- [ ] Create FULLTEXT indexes via Laravel migrations: `$table->fullText(['title', 'body'])`.
- [ ] PostgreSQL requires GIN indexes on `tsvector` columns.
- [ ] Evaluate: Database Engine vs Dedicated Search Engine
- [ ] Evaluate: Full-Text vs LIKE/Prefix Search
- [ ] Evaluate: Scout Database vs Collection Engine Selection

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Scout Database Engine following 02-database-fulltext-search patterns
- [ ] Configure all required settings for Scout Database Engine
- [ ] Register route/middleware/service for Scout Database Engine
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] FULLTEXT search is 10-100x faster than `LIKE` on >10K rows.
- [ ] FULLTEXT indexes add 30-50% overhead on insert/update operations.
- [ ] Without FULLTEXT index, Scout falls back to `LIKE` (100-1000x slower).
- [ ] Search queries compete with transactional queries for database resources.
- [ ] Read replicas offload search traffic from the primary database.

---

# Security Checklist

- [ ] MySQL FULLTEXT search is vulnerable to SQL injection if not parameterized (Scout handles this).
- [ ] Avoid exposing raw Boolean Mode operators to end users.
- [ ] Use Scout's `where()` for safe filtering.
- [ ] Monitor for computationally expensive wildcard queries.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] SCOUT_DRIVER=database configured
- [ ] FULLTEXT/GIN indexes created via migration
- [ ] SearchUsingFullText attribute applied
- [ ] Boolean Mode search returns expected results
- [ ] Performance measured against LIKE fallback
- [ ] Short word handling configured per database
- [ ] Write feature tests for happy path of Scout Database Engine
- [ ] Write feature tests for validation failure of Scout Database Engine
- [ ] Write feature tests for authentication failure of Scout Database Engine
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
- Create FULLTEXT Indexes in Migrations Before Using Engine
- Combine Full-Text and Prefix Attributes for Mixed Content
- Use Read Replicas for Search-Heavy Workloads

### Decisions
- Database Engine vs Dedicated Search Engine
- Full-Text vs LIKE/Prefix Search
- Scout Database vs Collection Engine Selection

## Related Knowledge
- K015 (SearchUsingFullText attribute)
- K016 (SearchUsingPrefix attribute)
- K003 (Scout collection engine)



