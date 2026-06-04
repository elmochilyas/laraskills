# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 08-relevance-and-ranking
**Knowledge Unit:** Personalized Ranking
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Personalized Ranking implementation follows 08-relevance-and-ranking patterns
- [ ] All edge cases handled for Personalized Ranking
- [ ] Full test coverage for Personalized Ranking
- [ ] Security review completed for Personalized Ranking
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Personalized Ranking
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Evaluate: Relevance Tuning Strategy
- [ ] Evaluate: BM25 vs Vector Similarity for Relevance
- [ ] Evaluate: Cross-Encoder Reranking Strategy

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Personalized Ranking following 08-relevance-and-ranking patterns
- [ ] Configure all required settings for Personalized Ranking
- [ ] Register route/middleware/service for Personalized Ranking
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Measure response time before and after implementation
- [ ] Add query count monitoring - N+1 detection
- [ ] Use eager loading for all relationships
- [ ] Add caching where appropriate for read-heavy endpoints
- [ ] Profile memory usage for large payloads

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

- [ ] Personalization signals identified
- [ ] Boosting implementation tested
- [ ] Cold start handled with fallback
- [ ] Privacy compliance verified
- [ ] A/B test showing improvement
- [ ] Write feature tests for happy path of Personalized Ranking
- [ ] Write feature tests for validation failure of Personalized Ranking
- [ ] Write feature tests for authentication failure of Personalized Ranking
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

- [ ] Avoid: User Embeddings Before Signal Boosting
- [ ] Avoid: No Cold Start Fallback
- [ ] Avoid: Deploying Personalization Without A/B Test
- [ ] Avoid: Ignoring Privacy Regulations
- [ ] Avoid: Personalization on Anonymous Users

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
- Rule Name

### Decisions
- Relevance Tuning Strategy
- BM25 vs Vector Similarity for Relevance
- Cross-Encoder Reranking Strategy

### Anti-Patterns
- User Embeddings Before Signal Boosting
- No Cold Start Fallback
- Deploying Personalization Without A/B Test
- Ignoring Privacy Regulations
- Personalization on Anonymous Users

## Related Knowledge
- K031 (Custom ranking rules)
- K062 (Cross-encoder re-ranking)
- K022 (Algolia A/B testing)



