# Anti-Patterns: RAG Pipeline Architecture

## Metadata

| | |
|---|---|
| **KU ID** | K069 |
| **Subdomain** | rag-search-pipelines |
| **Topic** | RAG Pipeline Architecture |
| **Source** | LangChain / LlamaIndex / General |
| **Maturity** | New |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 14-rag-search-pipelines |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Skip Retrieval Testing | Architecture | High |
| 2 | No Access Controls | Security | High |
| 3 | Infinite Context | Performance | Medium |
| 4 | No Fallback | Reliability | High |

## Repository-Wide Anti-Patterns

- **Generation-Before-Retrieval Syndrome**: Adding LLM generation before validating that retrieval produces relevant context
- **Context Without Permissions**: Passing retrieved documents to LLM without filtering by user access rights
- **Single-Point-of-Failure Pipeline**: No graceful degradation when any pipeline component fails

---

## 1. Skip Retrieval Testing

**Category:** Architecture

**Description:** Adding LLM generation to the pipeline without first validating that retrieval produces relevant, sufficient context for answering queries.

**Why It Happens:** Generation is the visible, exciting part of RAG. Teams build the full pipeline before testing components individually.

**Warning Signs:**
- No retrieval benchmarks exist
- LLM frequently responds "no relevant context found"
- Retrieval recall metrics have never been measured

**Why Harmful:** If retrieval quality is poor, all downstream work on prompt engineering, generation, and response formatting is wasted. The pipeline is fundamentally limited by its weakest link.

**Consequences:**
- Wasted effort optimizing generation for bad retrieval
- Undiagnosable quality issues (retrieval vs generation)
- False confidence in system before shipping

**Alternative:** Implement and benchmark retrieval independently first. Only add generation once retrieval recall exceeds 80%.

**Refactoring Strategy:**
1. Create a test set of 50-100 queries with ground-truth relevant documents
2. Measure retrieval recall@K and MRR
3. Optimize chunking, embedding, and search parameters until targets are met
4. Only then integrate generation

**Detection Checklist:**
- [ ] Is retrieval quality benchmarked with a test set?
- [ ] Are there measurable retrieval targets (recall >80%)?
- [ ] Is generation tuned without retrieval validation?

**Related Rules/Skills/Trees:**
- Rule: Benchmark Retrieval Before Adding Generation (`04-standardized-knowledge.md:37-38`)

---

## 2. No Access Controls

**Category:** Security

**Description:** Passing retrieved documents to the LLM without filtering by the requesting user's access permissions, potentially leaking sensitive data.

**Why It Happens:** Access control adds complexity to retrieval. Teams focus on pipeline functionality first and defer authorization.

**Warning Signs:**
- Multi-tenant system with no document-level permission checks
- Retrieved chunks include documents the user shouldn't see
- LLM can answer questions from restricted documents

**Why Harmful:** LLMs cannot distinguish between permitted and restricted content. If restricted documents are in the context, the LLM may surface sensitive information in answers.

**Consequences:**
- Data leakage across tenants or user roles
- Compliance violations (GDPR, HIPAA, SOC2)
- Legal liability from unauthorized data exposure

**Alternative:** Filter retrieved chunks by user permissions before passing to the LLM. Tag chunks with access metadata and apply security filters at retrieval time.

**Refactoring Strategy:**
1. Add access control metadata to each chunk (tenant_id, role, permission level)
2. Filter retrieval results by current user's permissions
3. Verify no restricted content appears in context

**Detection Checklist:**
- [ ] Are retrieved chunks filtered by user permissions?
- [ ] Is chunk metadata access-controlled?
- [ ] Can users query documents they shouldn't access?

**Related Rules/Skills/Trees:**
- Rule: Apply Access Controls Before Generation (`04-standardized-knowledge.md:59`)

---

## 3. Infinite Context

**Category:** Performance

**Description:** Retrieving as many chunks as possible without regard for LLM context window limits, causing degraded quality and increased costs.

**Why It Happens:** More context seems intuitively better. Teams assume LLMs effectively use all provided context.

**Warning Signs:**
- Retrieving 10-20+ chunks per query
- LLM API costs per query are very high
- Response quality degrades with more context

**Why Harmful:** Exceeding context windows causes silent truncation. Even within limits, LLM attention degrades over long contexts, and costs scale linearly.

**Consequences:**
- Diminishing and eventually negative returns from excessive context
- Linear cost increase without quality improvement
- Slower generation latency from larger prompts

**Alternative:** Retrieve a focused set of 3-5 most relevant chunks. Use re-ranking to select the best chunks within the context budget.

**Refactoring Strategy:**
1. Measure effective context usage (how many chunks are actually referenced)
2. Set maximum chunks to fit within 70% of model context
3. Use re-ranking to prioritize the most relevant chunks

**Detection Checklist:**
- [ ] Is there a maximum chunk limit based on context window?
- [ ] Are token counts measured before sending to LLM?
- [ ] Does more context improve or degrade quality?

**Related Rules/Skills/Trees:**
- Rule: Cap Retrieved Chunks to Context Window (`04-standardized-knowledge.md:52-53`)

---

## 4. No Fallback

**Category:** Reliability

**Description:** The RAG pipeline fails entirely when the LLM is unavailable, returning 500 errors instead of gracefully degrading to search results.

**Why It Happens:** Teams treat the LLM as an always-available component and don't design for failure modes.

**Warning Signs:**
- LLM API errors propagate as 500 responses
- No alternative response when generation fails
- No monitoring for LLM availability

**Why Harmful:** RAG systems depend on external LLM APIs that can be rate-limited, temporarily down, or have connectivity issues. Without fallback, these failures become user-facing errors.

**Consequences:**
- Complete service unavailability during LLM outages
- Frustrated users who can't get any results
- Increased support burden during incidents

**Alternative:** Implement a fallback path that returns raw search results when the LLM is unavailable or times out.

**Refactoring Strategy:**
1. Wrap LLM call in try/catch with timeout
2. On failure, return top search results directly (without generation)
3. Log the failure for monitoring and alerting

**Detection Checklist:**
- [ ] Is there a fallback when LLM is unavailable?
- [ ] Are LLM timeouts handled gracefully?
- [ ] Do users see errors or still get useful results?

**Related Rules/Skills/Trees:**
- Rule: Implement Fallback for LLM Failures (`04-standardized-knowledge.md:42-43`)
