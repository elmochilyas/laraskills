# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 02-database-fulltext-search
**Knowledge Unit:** Postgresql Full Text
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Postgresql Full Text implementation follows 02-database-fulltext-search patterns
- [ ] All edge cases handled for Postgresql Full Text
- [ ] Full test coverage for Postgresql Full Text
- [ ] Security review completed for Postgresql Full Text
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Postgresql Full Text

---

# Architecture Checklist

- [ ] Generated column: ALTER TABLE posts ADD search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || body)) STORED
- [ ] GIN index: CREATE INDEX posts_search_idx ON posts USING GIN(search_vector)
- [ ] Scout translates to 	o_tsvector(column) @@ plainto_tsquery(?) with 	s_rank() ordering
- [ ] Use websearch_to_tsquery() for safer user-facing query parsing
- [ ] Evaluate: Database Engine vs Dedicated Search Engine
- [ ] Evaluate: Full-Text vs LIKE/Prefix Search
- [ ] Evaluate: Scout Database vs Collection Engine Selection

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Postgresql Full Text following 02-database-fulltext-search patterns
- [ ] Configure all required settings for Postgresql Full Text
- [ ] Register route/middleware/service for Postgresql Full Text
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] GIN indexes are read-optimized but slow writes (30-50% overhead)
- [ ] GIN index bloat from frequent updates — schedule periodic REINDEX
- [ ] 	s_rank() computation adds marginal cost per row
- [ ] Generated columns add write-time overhead but improve read performance
- [ ] Sequential scan without GIN on large tables is prohibitive

---

# Security Checklist

- [ ] PostgreSQL FTS is not directly vulnerable to SQL injection with parameterized queries
- [ ] Use websearch_to_tsquery() instead of 	o_tsquery() for user input to avoid complex query injection
- [ ] Generated tsvector columns avoid runtime computation overhead
- [ ] Monitor for expensive ranking queries on large result sets

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] tsvector generated column created
- [ ] GIN index on tsvector column
- [ ] Search returns results with proper stemming
- [ ] Phrase search (<-> operator) works
- [ ] Text search configuration set per language
- [ ] REINDEX scheduled for index maintenance
- [ ] Write feature tests for happy path of Postgresql Full Text
- [ ] Write feature tests for validation failure of Postgresql Full Text
- [ ] Write feature tests for authentication failure of Postgresql Full Text
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
- Use Generated tsvector Columns with GIN Indexes
- Specify Correct Text Search Configuration Per Language
- Use websearch_to_tsquery for User Input
- Schedule Periodic REINDEX for GIN Indexes

### Decisions
- Database Engine vs Dedicated Search Engine
- Full-Text vs LIKE/Prefix Search
- Scout Database vs Collection Engine Selection

## Related Knowledge
- K041 (pgvector extension)
- K045 (pgvector + FTS hybrid)
- K015 (SearchUsingFullText attribute)
- K016 (SearchUsingPrefix attribute)



