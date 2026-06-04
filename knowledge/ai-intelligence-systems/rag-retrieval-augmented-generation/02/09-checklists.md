# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** rag-retrieval-augmented-generation
**Knowledge Unit:** ku-02
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Adapt chunk size to content type.
- [ ] Overlap 10-20%
- [ ] Respect document structure.
- [ ] Start with 256-512 token chunks
- [ ] Test multiple chunking strategies
- [ ] Chunk size is optimized for the content type (256-512 tokens default).
- [ ] Chunking preserves document structure (doesn't split mid-heading, mid-table, mid-code-block).
- [ ] Chunking strategy is configurable per document type.
- [ ] Adapt Chunk Size to Content Type
- [ ] Add 10-20% Chunk Overlap
- [ ] Prefer Semantic Chunking Over Fixed-Size
- [ ] Propagate Document Metadata to Every Chunk
- [ ] Test Multiple Chunking Strategies
- [ ] Chunking strategy versioned and stored per chunk
- [ ] Recursive chunking baseline established with measured recall@K
- [ ] Source metadata propagated per chunk
- [ ] Chunking strategy versioned for reproducibility
- [ ] Retrieval quality improved over naive fixed-size chunking
- [ ] Structural elements remain intact and retrievable

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

- [ ] Adapt chunk size to content type.
- [ ] Overlap 10-20%
- [ ] Respect document structure.
- [ ] Start with 256-512 token chunks
- [ ] Test multiple chunking strategies
- [ ] Use semantic chunking
- [ ] Adapt Chunk Size to Content Type
- [ ] Add 10-20% Chunk Overlap
- [ ] Prefer Semantic Chunking Over Fixed-Size
- [ ] Propagate Document Metadata to Every Chunk
- [ ] Test Multiple Chunking Strategies
- [ ] Chunk size

---

# Performance Checklist

- [ ] Batch chunking: process multiple documents concurrently in queued jobs.
- [ ] Chunk size affects retrieval speed: more chunks = larger vector index = slower search.
- [ ] Chunking is part of the **indexing pipeline** (async/offline), not the query path. Performance is less critical.
- [ ] Overlap increases storage: 20% overlap = 20% more chunks = 20% more storage and search time.
- [ ] Token counting for chunking: use the same tokenizer as the embedding model for accurate size control.

---

# Security Checklist

- [ ] Access control propagation:
- [ ] Chunk boundary security:
- [ ] Chunk injection:
- [ ] Document redaction:
- [ ] Metadata integrity:
- [ ] Fixed-size: ~1M tokens/second; Semantic: ~100K tokens/second

---

# Reliability Checklist

- [ ] Chunks too large (over 2000 tokens) â€” too much irrelevant information dilutes retrieval relevance.
- [ ] Chunks too small (under 100 tokens) â€” insufficient context for the LLM to understand the topic.
- [ ] No overlap â€” a question that straddles two chunks misses relevant context.
- [ ] Same chunk size for all document types â€” code, prose, tables, and lists need different strategies.
- [ ] Using fixed-size chunking that splits mid-sentence or mid-thought â€” creates incoherent chunks.

---

# Testing Checklist

- [ ] Chunk size is optimized for the content type (256-512 tokens default).
- [ ] Chunking preserves document structure (doesn't split mid-heading, mid-table, mid-code-block).
- [ ] Chunking strategy is configurable per document type.
- [ ] Chunking strategy versioned and stored per chunk
- [ ] Chunking strategy versioned for reproducibility
- [ ] Document metadata (source, title, position) propagates to each chunk.
- [ ] Multiple chunking strategies are benchmarked against retrieval quality metrics.
- [ ] Overlap (10-20%) is configured to prevent boundary information loss.
- [ ] Recursive chunking baseline established with measured recall@K
- [ ] Retrieval quality improved over naive fixed-size chunking

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Respect document structure.

---

# Anti-Pattern Prevention Checklist

- [ ] [Injecting Raw Retrieved Chunks Without Formatting]
- [ ] [Context Overload â€” More Retrieved Chunks Than Model Can Process]
- [ ] [No Structured Context Format â€” LLM Can't Distinguish Context from Query]
- [ ] [Context Injection After User Message â€” LLM Already Started Reasoning]
- [ ] [No Deduplication â€” Same Document Retrieved Multiple Times]
- [ ] Chunk-and-Forget:
- [ ] Ignoring Document Structure:
- [ ] No Chunk Context:
- [ ] Over-Engineering:
- [ ] Single-Strategy-Fits-All:

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


