# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** rag-retrieval-augmented-generation
**Knowledge Unit:** ku-01
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Chunk thoughtfully.
- [ ] Implement hybrid search.
- [ ] Include metadata.
- [ ] Optimize for retrieval quality first.
- [ ] Separate indexing and query pipelines.
- [ ] Chunk size and overlap are configurable and optimized for the document type.
- [ ] Document-level access control is implemented.
- [ ] Embedding model is consistent between indexing and querying.
- [ ] Implement Document-Level Access Control
- [ ] Implement Hybrid Search for Better Recall
- [ ] Sanitize Retrieved Documents for Injection
- [ ] Separate Indexing and Query Pipelines
- [ ] Set a Context Token Budget
- [ ] Context token budget prevents context window overflow
- [ ] Document-level access control filters at database level
- [ ] Hybrid search (vector + BM25) available for improved recall
- [ ] Context budget prevents token overflow while providing sufficient grounding
- [ ] No unauthorized document access via retrieval (access control verified)
- [ ] Retrieval quality (recall@5) > 0.8 measured via automated evaluation

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

- [ ] Chunk thoughtfully.
- [ ] Implement hybrid search.
- [ ] Include metadata.
- [ ] Optimize for retrieval quality first.
- [ ] Separate indexing and query pipelines.
- [ ] Use the same embedding model
- [ ] Implement Document-Level Access Control
- [ ] Implement Hybrid Search for Better Recall
- [ ] Sanitize Retrieved Documents for Injection
- [ ] Separate Indexing and Query Pipelines
- [ ] Set a Context Token Budget
- [ ] Track Retrieval Quality Over Time

---

# Performance Checklist

- [ ] Cache embeddings: cache query embeddings for repeated queries (TTL based on query freshness).
- [ ] Embedding latency: 50-200ms per query (depends on embedding model and hardware).
- [ ] Indexing throughput: optimize chunking and embedding for batch processing (parallel jobs).
- [ ] Total RAG latency = embedding + search + LLM inference. Typically 1-3 seconds total.
- [ ] Vector search: 10-100ms with ANN indexing (vs. 100-1000ms with brute force).
- [ ] Cache embeddings for repeated queries (content-hash key, TTL based on freshness)
- [ ] Embedding latency: 50-200ms per query
- [ ] Total RAG latency: 1-3 seconds (embedding + search + LLM inference)

---

# Security Checklist

- [ ] Citation integrity:
- [ ] Data leakage:
- [ ] Document-level access control:
- [ ] Index poisoning:
- [ ] Injection via documents:
- [ ] Cache embeddings for repeated queries (content-hash key, TTL based on freshness)
- [ ] Document-level access control â€” filter results based on user permissions
- [ ] Ensure retrieved documents are authentic (content-addressed storage)

---

# Reliability Checklist

- [ ] Ignoring metadata filtering â€” every query searches the entire corpus instead of a relevant subset.
- [ ] Not handling the case where no relevant documents are found â€” the model should say "I don't know" instead of hallucinating.
- [ ] Not tracking which documents were retrieved for which queries â€” impossible to debug retrieval quality.
- [ ] Retrieving too many documents â€” consuming the entire context window with low-value content.
- [ ] Using the wrong chunk size â€” chunks that are too small lose context; too large include irrelevant information.

---

# Testing Checklist

- [ ] Chunk size and overlap are configurable and optimized for the document type.
- [ ] Context budget prevents token overflow while providing sufficient grounding
- [ ] Context token budget prevents context window overflow
- [ ] Document-level access control filters at database level
- [ ] Document-level access control is implemented.
- [ ] Embedding model is consistent between indexing and querying.
- [ ] Hybrid search (vector + BM25) available for improved recall
- [ ] Hybrid search (vector + BM25) is available for improved recall.
- [ ] Indexing pipeline (chunk -> embed -> store) async via queue
- [ ] Indexing pipeline (chunk â†’ embed â†’ store) and query pipeline (embed â†’ search â†’ format â†’ generate) are separated.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Grounding â€” LLM Answers from Training Data, Not Retrieved Docs]
- [ ] [Retrieving Without Context Injection â€” Data Retrieved but Never Used]
- [ ] [No Citation in Responses â€” Can't Verify LLM Claims]
- [ ] [Indexing Without Metadata â€” Can't Filter or Scope]
- [ ] [No Re-Ranking â€” Top-K Results Include Irrelevant Matches]
- [ ] Garbage In, Garbage Out:
- [ ] No Relevance Scoring:
- [ ] One-Size-Fits-All Retrieval:
- [ ] RAG as Silver Bullet:
- [ ] Retrieval Without Caching:

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


