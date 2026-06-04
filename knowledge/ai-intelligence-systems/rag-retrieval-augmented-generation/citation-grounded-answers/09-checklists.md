# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** rag-retrieval-augmented-generation
**Knowledge Unit:** citation-grounded-answers
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Academic citation
- [ ] Audit trail for AI
- [ ] Citation verification post-process
- [ ] Inline vs. end citations
- [ ] Score-gated citation
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Include Chunk Metadata in Context
- [ ] Use Structured Output for Citations
- [ ] Validate Citations Against Retrieved Chunks
- [ ] Agent instructed to cite sources for each claim
- [ ] Citation statistics logged (citation rate, fabrication rate)
- [ ] Negative instruction prevents unsupported claims
- [ ] Citation fabrication rate < 1% (validated post-generation)
- [ ] Citation statistics provide quality signal for retrieval improvement
- [ ] Every RAG response includes validated citations for each claim

---

# Architecture Checklist

- [ ] Chunk
- [ ] Structured citation array vs. inline text â†’ Structured array in output schema. Reason: Machine
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization

---

# Implementation Checklist

- [ ] Academic citation
- [ ] Audit trail for AI
- [ ] Citation verification post-process
- [ ] Inline vs. end citations
- [ ] Score-gated citation
- [ ] Source attribution in context
- [ ] Structured citation schema
- [ ] Include Chunk Metadata in Context
- [ ] Use Structured Output for Citations
- [ ] Validate Citations Against Retrieved Chunks
- [ ] Citation granularity
- [ ] Inline text vs structured citations

---

# Performance Checklist

- [ ] Chunk metadata in context adds token overhead (negligible per chunk)
- [ ] Citation accuracy vs. verbosity
- [ ] Citation schema fields increase output tokens by 20-50%
- [ ] Citation validation post-process adds ~5-10ms per request
- [ ] Fabricated citations
- [ ] LLM instruction compliance
- [ ] Citation-enabled RAG response is same latency as standard RAG
- [ ] Structured output schema adds no measurable latency overhead

---

# Security Checklist

- [ ] Display citations in UI as expandable references â€” users should be able to click through to source
- [ ] Handle "no citation needed" responses (greetings, clarifications) gracefully
- [ ] Implement citation threshold â€” don't cite chunks below relevance score
- [ ] Log citation accuracy metrics (valid citations / total citations) â€” track over time
- [ ] Test citation accuracy per model â€” GPT-4o cites more reliably than Mistral Large
- [ ] Validate citations against actually-retrieved chunks â€” reject fabricated citations
- [ ] Citation validation is instant (<1ms) â€” simple array intersection check
- [ ] Validate citations post-generation â€” prevent LLM from fabricating sources

---

# Reliability Checklist

- [ ] Assuming all models support structured citation output equally
- [ ] Forgetting to handle responses without citations â€” not every answer needs a source
- [ ] Not including chunk metadata in context â€” LLM can't cite what it can't identify
- [ ] Not validating citations â€” LLM fabricates sources ("citation hallucination")
- [ ] Over-instructing citation format â€” LLM spends more tokens on citation formatting than answer

---

# Testing Checklist

- [ ] Agent instructed to cite sources for each claim
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Citation fabrication rate < 1% (validated post-generation)
- [ ] Citation statistics logged (citation rate, fabrication rate)
- [ ] Citation statistics provide quality signal for retrieval improvement
- [ ] Core concepts are understood and applied correctly.
- [ ] Every RAG response includes validated citations for each claim
- [ ] Negative instruction prevents unsupported claims
- [ ] Performance implications are accounted for in the design.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Structured citation schema

---

# Anti-Pattern Prevention Checklist

- [ ] [No Citations â€” Unverifiable LLM Claims]
- [ ] [LLM Generating Fake Citations (Hallucinated Sources)]
- [ ] [Citations Without Specific Location (Page/Paragraph)]
- [ ] [No Citation Verification Post-Generation]
- [ ] [Citations in Generated Text Not Linked to Source Documents]
- [ ] Circular citation
- [ ] Citation hallucination
- [ ] Long citation chains
- [ ] Missing citations
- [ ] Trivial citations

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Log citation fabrication incidents for security monitoring

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


