# Anti-Patterns: Meilisearch RAG / Conversational Search

## Metadata

| | |
|---|---|
| **KU ID** | K029 |
| **Subdomain** | rag-search-pipelines |
| **Topic** | Meilisearch RAG / Conversational Search |
| **Source** | Meilisearch Docs |
| **Maturity** | New |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 14-rag-search-pipelines |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Blind Optimism | Architecture | High |
| 2 | No Citations | Quality | High |
| 3 | Over-Retrieval | Performance | Medium |
| 4 | Missing Fallback | Reliability | High |

## Repository-Wide Anti-Patterns

- **RAG-Fixes-All Fallacy**: Assuming RAG eliminates hallucination risk without testing answer faithfulness
- **Citation-Free Answers**: Returning LLM-generated text without any reference to source documents
- **LLM-Required Dependency**: Making the entire search feature dependent on LLM availability

---

## 1. Blind Optimism

**Category:** Architecture

**Description:** Assuming that RAG inherently prevents hallucination without testing whether generated answers are faithful to the retrieved context.

**Why It Happens:** RAG is marketed as a solution for grounding LLM responses. Teams believe "RAG = grounded = no hallucination" without verification.

**Warning Signs:**
- No faithfulness evaluation in place
- LLM responses not checked against retrieved context
- Users report answers that don't match source documents

**Why Harmful:** RAG reduces but doesn't eliminate hallucination. LLMs can still ignore retrieved context, misinterpret information, or fabricate details. Without testing, hallucinated answers go undetected in production.

**Consequences:**
- Users receive incorrect information
- Trust in the search feature erodes
- Legal and compliance risks from wrong answers

**Alternative:** Test faithfulness systematically. Use RAGAS or manual evaluation to verify answers are grounded in retrieved context. Monitor answer faithfulness in production.

**Refactoring Strategy:**
1. Implement faithfulness evaluation (RAGAS or human review)
2. Track "answer grounded in context" rate
3. Add prompt instructions emphasizing context-only answers
4. Monitor and alert on low faithfulness scores

**Detection Checklist:**
- [ ] Is answer faithfulness evaluated?
- [ ] Is the LLM instructed to answer from context only?
- [ ] Are hallucination rates tracked?

**Related Rules/Skills/Trees:**
- Rule: Test Answer Faithfulness Systematically (`04-standardized-knowledge.md:37-38`)

---

## 2. No Citations

**Category:** Quality

**Description:** Returning AI-generated answers without including source document references, making answers unverifiable.

**Why It Happens:** Citations complicate response formatting. Teams prioritize answer fluency over verifiability.

**Warning Signs:**
- RAG responses contain only generated text
- Users cannot determine which documents the answer came from
- No source metadata included in API responses

**Why Harmful:** Without citations, users cannot verify AI-generated answers. If an answer is wrong, there's no way to trace it back to the source. This erodes trust in the system.

**Consequences:**
- Low user trust in AI answers
- Hallucinations go undetected longer
- No audit trail for answer provenance

**Alternative:** Always include source citations in answers. Use document titles, sections, and relevant excerpts as references.

**Refactoring Strategy:**
1. Preserve document metadata (title, section, URL) with each chunk
2. Modify system prompt to instruct LLM to cite sources
3. Include source references alongside generated answer in API response

**Detection Checklist:**
- [ ] Do answers include source citations?
- [ ] Is document metadata preserved through the pipeline?
- [ ] Can users verify where an answer came from?

**Related Rules/Skills/Trees:**
- Rule: Include Source Citations in Answers (`04-standardized-knowledge.md:38-39`)

---

## 3. Over-Retrieval

**Category:** Performance

**Description:** Sending too many chunks in the LLM context, exceeding the model's context window and degrading answer quality.

**Why It Happens:** Default search settings retrieve many results. Teams add all retrieved chunks to the LLM context without considering context window limits.

**Warning Signs:**
- Retrieving 15-20+ chunks per query
- Meilisearch returning many results that all get included in LLM prompt
- LLM responses showing signs of lost context (repetition, incoherence)

**Why Harmful:** Exceeding context windows causes silent truncation. Critical information may be dropped. LLM costs increase linearly with context size.

**Consequences:**
- Higher LLM costs per query
- Degraded answer quality from excessive context
- Slower generation latency

**Alternative:** Select the top 3-5 most relevant chunks for the LLM context. Use Meilisearch's ranking to ensure the best results are included.

**Refactoring Strategy:**
1. Cap the number of context chunks (3-5)
2. Use re-ranking or ranking rules to select best chunks
3. Monitor context token count per query

**Detection Checklist:**
- [ ] Is there a limit on context chunks sent to the LLM?
- [ ] Are context token counts monitored?
- [ ] Does adding more chunks improve or degrade quality?

**Related Rules/Skills/Trees:**
- Rule: Limit Context Chunks for LLM (`04-standardized-knowledge.md:40-41`)

---

## 4. Missing Fallback

**Category:** Reliability

**Description:** No graceful degradation when the LLM is unavailable — the search feature fails entirely instead of returning raw search results.

**Why It Happens:** The LLM is treated as a core component that must be available. Failure modes are not designed for.

**Warning Signs:**
- LLM API errors cause 500 errors
- No alternative response when generation fails
- No monitoring for LLM availability

**Why Harmful:** LLM APIs can be rate-limited, temporarily down, or have connectivity issues. Without fallback, these failures make the entire search feature unavailable.

**Consequences:**
- Complete search feature outage during LLM incidents
- Frustrated users who can't get any results
- Increased support burden

**Alternative:** Implement a fallback that returns raw search results (top documents without LLM generation) when the LLM is unavailable.

**Refactoring Strategy:**
1. Wrap LLM call in try/catch
2. On failure, return Meilisearch search results directly
3. Log LLM failures for monitoring and alerting
4. Add timeout to LLM calls to avoid hanging responses

**Detection Checklist:**
- [ ] Is there a fallback when LLM is unavailable?
- [ ] Do users see errors or still get useful results?
- [ ] Are LLM failures logged and alerted?

**Related Rules/Skills/Trees:**
- Rule: Implement LLM Fallback to Raw Search (`04-standardized-knowledge.md:42-43`)
