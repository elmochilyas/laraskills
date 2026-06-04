# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** rag-retrieval-augmented-generation
**Knowledge Unit:** ku-05
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Automate evaluation in CI.
- [ ] Build a test collection of 100-500 query-relevant document pairs.
- [ ] Evaluate multiple metrics.
- [ ] Segment evaluation by query type.
- [ ] Track quality over time.
- [ ] Evaluation is segmented by query type (factual, comparative, procedural).
- [ ] LLM-as-Judge relevance judgments are validated with human spot-checks.
- [ ] Precision@K and Recall@K are measured (not just one).
- [ ] Automate Evaluation in CI
- [ ] Build a Test Collection Before Optimizing
- [ ] Measure Both Precision and Recall
- [ ] Segment Evaluation by Query Type
- [ ] Track Quality Metrics Over Time
- [ ] Ablation studies measure impact of each component
- [ ] Baseline metrics established before any optimization
- [ ] Parameter tuning done systematically (one parameter at a time)
- [ ] Baseline metrics established and documented
- [ ] Each optimization shows measured improvement over baseline
- [ ] Production retrieval quality monitored with alerting on degradation

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Automate evaluation in CI.
- [ ] Build a test collection of 100-500 query-relevant document pairs.
- [ ] Evaluate multiple metrics.
- [ ] Segment evaluation by query type.
- [ ] Track quality over time.
- [ ] Use relevance scoring, not just binary.
- [ ] Automate Evaluation in CI
- [ ] Build a Test Collection Before Optimizing
- [ ] Measure Both Precision and Recall
- [ ] Segment Evaluation by Query Type
- [ ] Track Quality Metrics Over Time
- [ ] Annotation method

---

# Performance Checklist

- [ ] Computed metrics can be cached â€” if the pipeline hasn't changed, neither have the metrics.
- [ ] Evaluation queries should run against a **frozen snapshot** of the vector index to ensure reproducible results.
- [ ] For large test collections, sample queries for quick CI checks and run the full suite nightly.
- [ ] Relevance judgments from LLM-as-Judge: use a cheaper model and validate with human spot-checks.
- [ ] Running a full evaluation suite (100 queries Ã— multiple K values) takes 1-10 minutes (embedding + search).
- [ ] Production monitoring: negligible overhead (log query + result IDs)

---

# Security Checklist

- [ ] Corpus integrity:
- [ ] Evaluation leakage:
- [ ] LLM-as-Judge bias:
- [ ] Metric manipulation:
- [ ] Test collection sensitivity:
- [ ] Production query logging must redact PII before storage

---

# Reliability Checklist

- [ ] Evaluating retrieval without evaluating end-to-end RAG quality â€” good retrieval + bad generation = bad answers.
- [ ] Not segmenting by query type â€” optimizing for the average may hurt specific query categories.
- [ ] Not tracking quality over time â€” degradation goes unnoticed until users complain.
- [ ] Only measuring Precision@K without Recall@K â€” you find only relevant documents but miss many relevant ones.
- [ ] Over-optimizing for a test collection (overfitting) â€” the pipeline may not generalize to unseen queries.
- [ ] Using a test collection that doesn't represent real user queries â€” lab metrics don't match production performance.

---

# Testing Checklist

- [ ] Ablation studies measure impact of each component
- [ ] Baseline metrics established and documented
- [ ] Baseline metrics established before any optimization
- [ ] Each optimization shows measured improvement over baseline
- [ ] Evaluation is segmented by query type (factual, comparative, procedural).
- [ ] LLM-as-Judge relevance judgments are validated with human spot-checks.
- [ ] Parameter tuning done systematically (one parameter at a time)
- [ ] Precision@K and Recall@K are measured (not just one).
- [ ] Production retrieval quality monitored via logged queries
- [ ] Production retrieval quality monitored with alerting on degradation

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Synchronous Ingestion of Large Documents â€” Blocks Worker]
- [ ] [No Idempotency â€” Re-ingesting Document Creates Duplicates]
- [ ] [Ingestion Without Error Handling â€” One Bad Document Fails All]
- [ ] [No Incremental Ingestion â€” Full Re-Index on Every Run]
- [ ] [No Validation of Ingested Content]
- [ ] Ignoring Edge Queries:
- [ ] Manual Evaluation Only:
- [ ] Metric Hacking:
- [ ] No Baseline:
- [ ] One-Time Evaluation:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Production monitoring: negligible overhead (log query + result IDs)
- [ ] Production query logging must redact PII before storage

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


