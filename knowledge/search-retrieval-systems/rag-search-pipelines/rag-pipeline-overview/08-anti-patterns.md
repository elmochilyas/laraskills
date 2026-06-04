# Anti-Patterns: RAG Pipeline Overview

## Metadata

| | |
|---|---|
| **KU ID** | ku-01 |
| **Subdomain** | rag-search-pipelines |
| **Topic** | RAG Pipeline Overview |
| **Source** | LangChain / LlamaIndex / Industry |
| **Maturity** | New |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 14-rag-search-pipelines |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Garbage In, Garbage Out | Architecture | High |
| 2 | Context Window Overload | Performance | Medium |
| 3 | No Source Attribution | Quality | High |
| 4 | Single Chunk Retrieval | Architecture | Medium |
| 5 | No Streaming Implementation | UX | Low |

## Repository-Wide Anti-Patterns

- **Generation-Before-Retrieval Fallacy**: Optimizing LLM prompts and generation parameters before verifying retrieval quality
- **Context Window Assumption**: Assuming the LLM can process unlimited context without degradation
- **Hallucination-As-Feature**: Treating hallucinated answers as acceptable without grounding verification

---

## 1. Garbage In, Garbage Out

**Category:** Architecture

**Description:** Focusing on generation quality (prompt engineering, LLM model selection) before ensuring retrieval quality (recall, precision, chunk relevance).

**Why It Happens:** Generation improvements are more visible and exciting. Teams jump to prompt tuning because it feels productive, while retrieval issues are harder to diagnose.

**Warning Signs:**
- Spending more time on system prompts than on retrieval benchmarks
- LLM frequently says "no relevant context found"
- Adding generation features while retrieval recall is below 80%

**Why Harmful:** If retrieval fails to find relevant context, no amount of prompt engineering will produce correct answers. The pipeline is fundamentally broken at the retrieval stage.

**Consequences:**
- Wasted effort on generation optimization that can't compensate for poor retrieval
- Users receive incorrect or hallucinated answers
- False confidence in system quality

**Alternative:** Benchmark retrieval quality (recall@K, MRR, NDCG) before implementing generation. Only iterate on generation after retrieval metrics meet targets.

**Refactoring Strategy:**
1. Implement retrieval-only endpoint and benchmark against test set
2. Optimize chunking, embedding, and search parameters until recall meets targets
3. Only then add generation layer and evaluate end-to-end

**Detection Checklist:**
- [ ] Is retrieval quality benchmarked independently?
- [ ] Are there retrieval recall targets (<80% = stop and fix)?
- [ ] Is generation optimized before retrieval is verified?

**Related Rules/Skills/Trees:**
- Rule: Benchmark Retrieval Before Generation (`04-standardized-knowledge.md:38-39`)

---

## 2. Context Window Overload

**Category:** Performance

**Description:** Retrieving too many chunks that exceed the LLM's context window, causing truncation, degraded quality, or increased cost.

**Why It Happens:** More context feels safer. Teams assume "more information = better answer" without considering LLM context limits or the degradation that occurs at the edges of the context window.

**Warning Signs:**
- Retrieving 15-20+ chunks per query
- LLM responses show signs of lost context (repetition, incoherence)
- Prompt truncation warnings in LLM API responses

**Why Harmful:** Exceeding context windows causes silent truncation, drops critical information, and increases per-query LLM costs linearly with token count.

**Consequences:**
- Higher API costs without quality improvement
- Silent information loss at context boundaries
- Slower generation latency due to larger prompts

**Alternative:** Retrieve the top 3-5 most relevant chunks that fit within the LLM's effective context window (typically 70% of max to leave room for instructions and output).

**Refactoring Strategy:**
1. Measure total tokens per query (input + output)
2. Cap context chunks to fit within 70% of model's max context
3. Use re-ranking to select the most relevant chunks within the limit

**Detection Checklist:**
- [ ] Are retrieved chunks token-counted before prompt assembly?
- [ ] Is there a hard cap on context chunk count?
- [ ] Are prompts checked for truncation?

**Related Rules/Skills/Trees:**
- Rule: Cap Context Chunks to Fit LLM Window (`04-standardized-knowledge.md:40`)

---

## 3. No Source Attribution

**Category:** Quality

**Description:** Returning LLM-generated answers without including source document references, making answers unverifiable.

**Why It Happens:** Citations add complexity to the response format. Teams prioritize answer fluency over verifiability.

**Warning Signs:**
- RAG responses contain only generated text with no citations
- Users can't tell which documents the answer came from
- No metadata (source title, section, page) included in response

**Why Harmful:** Without citations, users cannot verify AI-generated answers. This erodes trust, enables hallucination to go undetected, and makes debugging retrieval issues impossible.

**Consequences:**
- Low user trust in AI answers
- Hallucinations go undetected longer
- No audit trail for answer provenance

**Alternative:** Always include source references in responses — document title, section, and relevant snippet. Format citations naturally in the answer text.

**Refactoring Strategy:**
1. Preserve chunk metadata (source, section, page) through the pipeline
2. Modify prompt to instruct LLM to cite sources in answers
3. Include source list alongside generated answer in API response

**Detection Checklist:**
- [ ] Do RAG responses include source references?
- [ ] Is chunk metadata preserved and returned?
- [ ] Can users verify where an answer came from?

**Related Rules/Skills/Trees:**
- Rule: Always Include Source Citations (`04-standardized-knowledge.md:39`)

---

## 4. Single Chunk Retrieval

**Category:** Architecture

**Description:** Retrieving only one chunk per query, assuming it contains all necessary context for the LLM to answer.

**Why It Happens:** Simpler implementation. Single-chunk retrieval maps naturally to "find the closest document" mental model and avoids the complexity of merging multiple contexts.

**Warning Signs:**
- `topK: 1` in similarity search configuration
- LLM frequently lacks context to answer questions
- Answers are incomplete or overly narrow

**Why Harmful:** A single chunk rarely contains sufficient context for a complete answer. Key information may be split across chunks, spread across multiple documents, or require synthesis from multiple sources.

**Consequences:**
- Incomplete or incorrect answers
- Poor coverage for questions spanning multiple topics
- Underutilization of available knowledge

**Alternative:** Retrieve 3-5 chunks and format them as combined context with clear source separation.

**Refactoring Strategy:**
1. Increase `topK` to 3-5
2. Format multiple chunks with source labels in the context
3. Instruct LLM to synthesize information across all provided chunks

**Detection Checklist:**
- [ ] Is `topK` configured below 3?
- [ ] Do answers reference multiple sources when needed?
- [ ] Is chunk merging implemented in prompt formatting?

**Related Rules/Skills/Trees:**
- Rule: Retrieve Multiple Chunks Per Query (`04-standardized-knowledge.md:40-41`)

---

## 5. No Streaming Implementation

**Category:** UX

**Description:** Waiting for the entire LLM response to complete before showing any output to the user.

**Why It Happens:** Streaming requires more complex response handling on both backend and frontend. Non-streaming is the default in most API clients.

**Warning Signs:**
- Users wait 3-10 seconds with no feedback
- Mobile app shows loading spinner for 5+ seconds
- No partial response shown during generation

**Why Harmful:** Generation dominates RAG latency (500-5000ms). Without streaming, users perceive the system as slow and unresponsive. Streaming reduces perceived latency to <500ms (time to first token).

**Consequences:**
- Poor user experience and higher abandonment
- System perceived as slow despite fast retrieval
- Reduced user engagement with RAG features

**Alternative:** Implement streaming responses that show tokens as they arrive. Use Server-Sent Events or WebSockets for real-time delivery.

**Refactoring Strategy:**
1. Switch LLM API call to streaming mode
2. Implement SSE endpoint for streaming responses
3. Update frontend to render streaming tokens incrementally

**Detection Checklist:**
- [ ] Is LLM response streaming implemented?
- [ ] Is time-to-first-token under 500ms?
- [ ] Do users see partial responses within 1 second?

**Related Rules/Skills/Trees:**
- Rule: Stream LLM Responses for UX (`04-standardized-knowledge.md:41-42`)
