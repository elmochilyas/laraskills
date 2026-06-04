# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** rag-retrieval-augmented-generation
**Knowledge Unit:** hybrid-search
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Boolean filtering
- [ ] Cascading retrieval
- [ ] Ensemble for search
- [ ] Î± weighting
- [ ] Metadata pre-filter
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Always Use Hybrid Search for Text Retrieval
- [ ] Normalize Scores Before Weighted Combination
- [ ] Tune RRF k-Constant per Corpus
- [ ] Both vector and full-text search indexes exist
- [ ] Hybrid search recall measured and superior to pure vector or pure keyword alone
- [ ] Metadata filters applied after fusion
- [ ] Exact keyword matches (IDs, product codes, proper nouns) appear in top results
- [ ] Hybrid search recall@10 > 0.90 (vs typical 0.75 for pure vector)
- [ ] Query latency within acceptable range for use case

---

# Architecture Checklist

- [ ] Database
- [ ] RRF vs. weighted fusion â†’ RRF default (no score normalization needed); weighted for domain
- [ ] tsvector vs. external search â†’ tsvector built into PostgreSQL. Reason: No additional infrastructure, hybrid query in one SQL statement
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Boolean filtering
- [ ] Cascading retrieval
- [ ] Ensemble for search
- [ ] Î± weighting
- [ ] Metadata pre-filter
- [ ] RRF fusion
- [ ] Two signals, one answer
- [ ] Always Use Hybrid Search for Text Retrieval
- [ ] Normalize Scores Before Weighted Combination
- [ ] Tune RRF k-Constant per Corpus
- [ ] RRF k value
- [ ] RRF vs weighted combination

---

# Performance Checklist

- [ ] Combined: 10-100ms â€” acceptable for most applications
- [ ] HNSW vector index scan: ~5-50ms for 1M rows (depends on ef_search)
- [ ] Hybrid query is slower than either alone â€” both index scans run sequentially
- [ ] Index both columns independently â€” PostgreSQL can use bitmap OR for parallel index scans
- [ ] RRF requires both result sets fully computed before fusion â€” memory overhead
- [ ] tsvector index scan: ~5-50ms for 1M rows
- [ ] Hybrid search ~2x latency of single-method search (both queries run)

---

# Security Checklist

- [ ] Cache hybrid results for repeated queries â€” skip re-execution for exact match queries
- [ ] Implement timeout on hybrid queries â€” combined search can be slower than expected
- [ ] Index both `tsvector` (GIN) and `vector` (HNSW) columns before running hybrid queries
- [ ] Log hybrid search quality metrics â€” track precision@K, recall@K over time
- [ ] Monitor query plans â€” ensure indexes are being used, not sequential scans
- [ ] Test hybrid weight Î± on representative queries â€” not intuition-driven
- [ ] Apply tenant/access control filters to both vector and keyword result sets
- [ ] Log query patterns to detect scraping or injection attempts

---

# Reliability Checklist

- [ ] Assuming hybrid search is always better than pure vector search â€” test on your data
- [ ] Ignoring tsvector language configuration â€” wrong language config degrades keyword matching
- [ ] Not normalizing scores before combination â€” vector distance [-1,1] vs. ts_rank [0,1]
- [ ] Running hybrid search on unindexed columns â€” slow full-table scans
- [ ] Using equal weights (Î±=0.5) without testing â€” optimal weight varies by domain
- [ ] Always Use Hybrid Search for Text Retrieval

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Both vector and full-text search indexes exist
- [ ] Core concepts are understood and applied correctly.
- [ ] Exact keyword matches (IDs, product codes, proper nouns) appear in top results
- [ ] Hybrid search recall measured and superior to pure vector or pure keyword alone
- [ ] Hybrid search recall@10 > 0.90 (vs typical 0.75 for pure vector)
- [ ] Metadata filters applied after fusion
- [ ] Performance implications are accounted for in the design.
- [ ] Production deployment follows recommended practices.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Vector-Only Search â€” Missing Exact Keyword Matches]
- [ ] [Keyword-Only Search â€” Missing Semantic Matches]
- [ ] [Equal Weights for Vector and Keyword â€” No Tuning]
- [ ] [Normalization Mismatch Between Vector and Keyword Scores]
- [ ] [Hybrid Search Without Evaluation â€” Tuning Blind]
- [ ] GIN index bloat
- [ ] Language mismatch
- [ ] Query ambiguity
- [ ] Score domain mismatch
- [ ] Weight calibration failure

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Log query patterns to detect scraping or injection attempts
- [ ] RRF fusion computation: O(N log N) for N candidates â€” negligible for <1000 candidates

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


