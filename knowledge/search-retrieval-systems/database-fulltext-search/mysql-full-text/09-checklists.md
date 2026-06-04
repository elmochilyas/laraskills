# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 02-database-fulltext-search
**Knowledge Unit:** Mysql Full Text
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Mysql Full Text implementation follows 02-database-fulltext-search patterns
- [ ] All edge cases handled for Mysql Full Text
- [ ] Full test coverage for Mysql Full Text
- [ ] Security review completed for Mysql Full Text
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Mysql Full Text

---

# Architecture Checklist

- [ ] Create FULLTEXT indexes via migrations: $table->fullText(['title', 'body']);
- [ ] Scout translates Model::search() to MATCH(columns) AGAINST(? IN BOOLEAN MODE)
- [ ] Combine FULLTEXT with B-tree indexes on frequently filtered columns
- [ ] Consider read replicas for search-heavy workloads
- [ ] Falls back to LIKE if no FULLTEXT index on the column
- [ ] Evaluate: Database Engine vs Dedicated Search Engine
- [ ] Evaluate: Full-Text vs LIKE/Prefix Search
- [ ] Evaluate: Scout Database vs Collection Engine Selection

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Mysql Full Text following 02-database-fulltext-search patterns
- [ ] Configure all required settings for Mysql Full Text
- [ ] Register route/middleware/service for Mysql Full Text
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] FULLTEXT search is 10-100x faster than LIKE on >10K rows
- [ ] FULLTEXT indexes add 30-50% overhead on insert/update
- [ ] Without FULLTEXT index, Scout falls back to LIKE scans (100-1000x slower)
- [ ] Search queries compete with transactional queries for database resources

---

# Security Checklist

- [ ] MySQL FULLTEXT search is vulnerable to SQL injection if not using parameterized queries (Scout handles this)
- [ ] Avoid exposing raw Boolean Mode operators to end users
- [ ] Use Scout's where() for safe filtering
- [ ] Monitor for computationally expensive wildcard queries

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] FULLTEXT index created via migration
- [ ] SearchUsingFullText attribute applied to model
- [ ] Boolean Mode search returns expected results
- [ ] Performance measured against LIKE fallback
- [ ] Short word handling configured (innodb_ft_min_token_size)
- [ ] 50% threshold behavior understood
- [ ] Write feature tests for happy path of Mysql Full Text
- [ ] Write feature tests for validation failure of Mysql Full Text
- [ ] Write feature tests for authentication failure of Mysql Full Text
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
- Always Create FULLTEXT Index Before Using SearchUsingFullText
- Use Boolean Mode to Avoid the 50% Threshold
- Configure Minimum Token Size for Short Content
- Never Rely on LIKE Scans for Production Search

### Decisions
- Database Engine vs Dedicated Search Engine
- Full-Text vs LIKE/Prefix Search
- Scout Database vs Collection Engine Selection

## Related Knowledge
- K002 (Scout database engine)
- K015 (SearchUsingFullText attribute)
- K016 (SearchUsingPrefix attribute)



