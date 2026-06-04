# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** rag-retrieval-augmented-generation
**Knowledge Unit:** ku-03
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Batch embedding requests
- [ ] Cache query embeddings
- [ ] Choose an embedding model based on your domain.
- [ ] Prefer higher dimensions for general search
- [ ] Use Matryoshka embeddings
- [ ] Batch embedding is implemented for indexing pipelines.
- [ ] Embedding cache exists for query embeddings with configurable TTL.
- [ ] Embedding dimensions match the vector database configuration.
- [ ] Batch Embedding Requests for Indexing
- [ ] Cache Query Embeddings
- [ ] Monitor Embedding Quality and Costs
- [ ] Use a Provider-Agnostic Embedding Interface
- [ ] Use Local Embedding Models for Sensitive Data
- [ ] All vectors in same index use same model
- [ ] Batch embedding configured (20-50 texts per call)
- [ ] Content-hash caching active
- [ ] All vectors in same index use consistent model
- [ ] Cache reduces embedding API calls by 60-80%
- [ ] Embedding providers swappable via configuration

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

- [ ] Batch embedding requests
- [ ] Cache query embeddings
- [ ] Choose an embedding model based on your domain.
- [ ] Prefer higher dimensions for general search
- [ ] Use Matryoshka embeddings
- [ ] Use the same embedding model
- [ ] Batch Embedding Requests for Indexing
- [ ] Cache Query Embeddings
- [ ] Monitor Embedding Quality and Costs
- [ ] Use a Provider-Agnostic Embedding Interface
- [ ] Use Local Embedding Models for Sensitive Data
- [ ] Use Matryoshka Embeddings for Flexible Dimensions

---

# Performance Checklist

- [ ] Batch size tuning: optimal batch size depends on provider (OpenAI: 100-500, local: 50-200).
- [ ] Embedding latency: 50-200ms per API call (batch of 100-1000 texts is similar latency to a single call).
- [ ] Embedding throughput: OpenAI limits at ~3000 RPM for text-embedding-3-small. Plan indexing pipelines accordingly.
- [ ] Local embedding models: BGE-small runs at 100+ texts/second on a consumer GPU; BERT-based on CPU at 10-20 texts/second.
- [ ] Vector dimensions vs. search speed: 384-dim vectors search 4x faster than 1536-dim with the same index.
- [ ] Batch embedding reduces per-text overhead 5-10x vs individual calls
- [ ] Cache embeddings by content hash â€” regenerate only changed content

---

# Security Checklist

- [ ] Cache security:
- [ ] Data sent to embedding providers:
- [ ] Embedding reversal:
- [ ] Local embedding for sensitive data:
- [ ] Model provenance:
- [ ] Cache embeddings by content hash â€” regenerate only changed content
- [ ] Handle rate limits with exponential backoff
- [ ] Pin model version â€” switching silently invalidates existing vectors

---

# Reliability Checklist

- [ ] Embedding each chunk individually (no batching) â€” 10x slower than batch embedding.
- [ ] Not considering embedding costs â€” embedding 1M documents costs real money (OpenAI: ~$0.13/1M tokens).
- [ ] Not normalizing embeddings â€” cosine similarity assumes unit-length vectors.
- [ ] Using different embedding models for indexing and querying â€” vectors are in incompatible spaces.
- [ ] Using too many dimensions â€” 1536-dim vectors when 384 would suffice wastes storage and search time.

---

# Testing Checklist

- [ ] All vectors in same index use consistent model
- [ ] All vectors in same index use same model
- [ ] Batch embedding configured (20-50 texts per call)
- [ ] Batch embedding is implemented for indexing pipelines.
- [ ] Cache reduces embedding API calls by 60-80%
- [ ] Content-hash caching active
- [ ] Embedding cache exists for query embeddings with configurable TTL.
- [ ] Embedding dimensions match the vector database configuration.
- [ ] Embedding latency, error rate, and cost are monitored.
- [ ] Embedding metadata stored

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Top-K Too Large â€” Irrelevant Results Dilute Context]
- [ ] [Top-K Too Small â€” Missing Relevant Documents]
- [ ] [No Query Rewriting â€” User Query Directly Used for Embedding Search]
- [ ] [Same K for All Query Types â€” No Dynamic Adjustment]
- [ ] [No Multi-Turn Retrieval â€” Follow-Up Questions Don't Search Again]
- [ ] Embedding Everything:
- [ ] No Embedding Monitoring:
- [ ] One-Shot Embedding:
- [ ] Provider Lock-In:
- [ ] Re-Embedding Everything:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

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


