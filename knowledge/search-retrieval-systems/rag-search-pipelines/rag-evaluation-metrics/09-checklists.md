# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 14-rag-search-pipelines
**Knowledge Unit:** Rag Evaluation Metrics
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Rag Evaluation Metrics implementation follows 14-rag-search-pipelines patterns
- [ ] All edge cases handled for Rag Evaluation Metrics
- [ ] Full test coverage for Rag Evaluation Metrics
- [ ] Security review completed for Rag Evaluation Metrics
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Rag Evaluation Metrics
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Offline evaluation: Run test set nightly, report metrics to dashboard
- [ ] Online monitoring: Log queries, retrieved chunks, generated answers, user feedback
- [ ] Alert on metric degradation: Faithfulness drop, answer rate drop
- [ ] A/B test framework: Compare two configurations on live traffic (small percentage)
- [ ] Evaluate: RAG Pipeline Architecture Selection
- [ ] Evaluate: Chunking Strategy Selection
- [ ] Evaluate: Embedding Model Selection for RAG

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Rag Evaluation Metrics following 14-rag-search-pipelines patterns
- [ ] Configure all required settings for Rag Evaluation Metrics
- [ ] Register route/middleware/service for Rag Evaluation Metrics
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Offline evaluation: Compute-intensive (embed all test queries, generate answers)
- [ ] RAGAS evaluation: Requires LLM calls to judge answer quality
- [ ] Store evaluation results in database for trend analysis
- [ ] Evaluation pipeline should run async (queue job)

---

# Security Checklist

- [ ] Test set may contain sensitive data — secure storage required
- [ ] LLM-based evaluation sends data to API providers
- [ ] Avoid including PII in evaluation samples

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Test set of 100+ queries with ground truth created
- [ ] Retrieval metrics (recall, MRR, NDCG) implemented
- [ ] Generation metrics (faithfulness, relevance) implemented
- [ ] Nightly evaluation pipeline running
- [ ] Online user feedback tracking (thumbs up/down)
- [ ] Alerts configured for metric degradation
- [ ] Regression testing before deployment changes
- [ ] Write feature tests for happy path of Rag Evaluation Metrics
- [ ] Write feature tests for validation failure of Rag Evaluation Metrics
- [ ] Write feature tests for authentication failure of Rag Evaluation Metrics
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

- [ ] Avoid: 1 | Evaluating Without Ground Truth | Testing
- [ ] Avoid: 2 | Only Measuring Generation Quality | Testing
- [ ] Avoid: 3 | No Online Monitoring | Observability
- [ ] Avoid: 4 | Treating Evaluation as One-Time | Process
- [ ] Avoid: Ground Truth Fallacy
- [ ] Avoid: Generation-Only Focus
- [ ] Avoid: Offline-Only Evaluation

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
- RAG Pipeline Architecture Selection
- Chunking Strategy Selection
- Embedding Model Selection for RAG

### Anti-Patterns
- 1 | Evaluating Without Ground Truth | Testing
- 2 | Only Measuring Generation Quality | Testing
- 3 | No Online Monitoring | Observability
- 4 | Treating Evaluation as One-Time | Process
- Ground Truth Fallacy
- Generation-Only Focus
- Offline-Only Evaluation

## Related Knowledge
- K069 (RAG pipeline architecture)
- K062 (Cross-encoder re-ranking)
- K067 (Embedding generation strategies)
- K068 (Chunking strategies for RAG)



