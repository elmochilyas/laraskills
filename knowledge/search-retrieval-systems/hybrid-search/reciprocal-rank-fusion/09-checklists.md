# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 07-hybrid-search
**Knowledge Unit:** Reciprocal Rank Fusion
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Reciprocal Rank Fusion implementation follows 07-hybrid-search patterns
- [ ] All edge cases handled for Reciprocal Rank Fusion
- [ ] Full test coverage for Reciprocal Rank Fusion
- [ ] Security review completed for Reciprocal Rank Fusion
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Reciprocal Rank Fusion
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Implement in PHP for application-level fusion.
- [ ] Use engine-native RRF when available (Qdrant, Milvus, Meilisearch).
- [ ] For application-level: query both engines concurrently, fuse in memory.
- [ ] Fusion is fast (<1ms for top-100 from 2 engines).
- [ ] Evaluate: Hybrid Search Fusion Strategy
- [ ] Evaluate: Keyword vs Vector Search Weight Allocation
- [ ] Evaluate: Built-in vs Custom Hybrid Implementation

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Reciprocal Rank Fusion following 07-hybrid-search patterns
- [ ] Configure all required settings for Reciprocal Rank Fusion
- [ ] Register route/middleware/service for Reciprocal Rank Fusion
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] RRF computation is O(m Ã— n) where m = result lists, n = total unique items.
- [ ] For typical usage (2 engines, top-100 each), RRF completes in microseconds.
- [ ] No external dependencies â€” runs in application memory.
- [ ] Fusing in application adds one network round-trip (both queries must complete).

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

- [ ] RRF fusion implemented (application or engine-native)
- [ ] k value tuned for your data (start with 60)
- [ ] Candidate pool size optimized (top-100 per path)
- [ ] Fusion balance monitored (one path not dominating)
- [ ] Individual path quality benchmarked
- [ ] Write feature tests for happy path of Reciprocal Rank Fusion
- [ ] Write feature tests for validation failure of Reciprocal Rank Fusion
- [ ] Write feature tests for authentication failure of Reciprocal Rank Fusion
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

- [ ] Avoid: Using k < 10 for RRF
- [ ] Avoid: Expecting RRF to Fix Poor Retrieval Paths
- [ ] Avoid: Fusing Unlimited Candidate Pools
- [ ] Avoid: Not Handling Empty Result Lists
- [ ] Avoid: Modifying the RRF Formula Unnecessarily

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
- Hybrid Search Fusion Strategy
- Keyword vs Vector Search Weight Allocation
- Built-in vs Custom Hybrid Implementation

### Anti-Patterns
- Using k < 10 for RRF
- Expecting RRF to Fix Poor Retrieval Paths
- Fusing Unlimited Candidate Pools
- Not Handling Empty Result Lists
- Modifying the RRF Formula Unnecessarily

## Related Knowledge
- K028 (Meilisearch hybrid search)
- K045 (pgvector + FTS hybrid)
- K049 (Qdrant hybrid queries)
- K060 (Milvus hybrid search)
- K062 (Cross-encoder re-ranking)



