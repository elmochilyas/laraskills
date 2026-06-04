# Skill: Implement Citation-Grounded Answers in RAG
## Purpose
Structure RAG agent responses with machine-parseable citations connecting each claim to specific source documents, enabling verification, audit trails, and user trust.
## When To Use
- Q&A systems where answer accuracy and source attribution are critical
- Compliance-sensitive applications requiring audit trails
- Customer-facing knowledge base bots where users need to verify claims
- Legal, medical, or financial domains where documentation is required
## When NOT To Use
- Creative writing or brainstorming where citations are irrelevant
- Prototypes before RAG quality is established
## Prerequisites
- RAG pipeline with chunked and indexed documents
- Agent with structured output (HasStructuredOutput schema)
- Chunk metadata including source, section, position identifiers
## Inputs
- User query
- Retrieved document chunks with metadata (source, section, ID, score)
- Agent output schema with citations array field
- System prompt instructing citation behavior
## Workflow (numbered)
1. Include chunk metadata (source, section, ID) in the context injected into the agent
2. Define structured output schema with `citations: array<{chunk_id, relevance}>` field
3. Instruct agent in system prompt to cite sources for each claim using chunk IDs
4. Add negative instruction: "If no retrieved chunk supports a claim, do not make that claim"
5. After agent response, validate citations against the set of retrieved chunks
6. Reject or flag fabricated citations (citations to chunks not in retrieved set)
7. Return structured response with answer text and validated citations array
8. Log citation statistics (citation rate, fabrication rate) for quality monitoring
## Validation Checklist
- [ ] Structured output schema includes citations array field
- [ ] Retrieved chunks include metadata (source, section, ID) in context
- [ ] Agent instructed to cite sources for each claim
- [ ] Negative instruction prevents unsupported claims
- [ ] Post-generation citation validation rejects fabricated citations
- [ ] Citation statistics logged (citation rate, fabrication rate)
- [ ] UI presents citations as clickable source links (if applicable)
## Common Failures
- No structured citation schema — LLM may or may not cite, can't validate
- Retrieved chunks lack metadata — agent can't identify sources to cite
- No citation validation — fabricated citations go undetected
- Agent told to "cite sources" without structured format — inconsistent output
- No negative instruction — LLM makes unsupported claims without citation
## Decision Points
- **Inline text vs structured citations**: Structured `citations[]` array for machine-parseability and validation
- **Citation granularity**: Chunk-level (most precise), document-level (simpler), section-level (balanced)
- **Post-generation validation**: Reject all fabricated citations, flag some, or accept with disclaimer?
## Performance Considerations
- Citation validation is instant (<1ms) — simple array intersection check
- Structured output schema adds no measurable latency overhead
- Citation-enabled RAG response is same latency as standard RAG
## Security Considerations
- Validate citations post-generation — prevent LLM from fabricating sources
- Never include raw citation metadata that reveals internal document structure
- Log citation fabrication incidents for security monitoring
- Ensure citations don't leak document content beyond what was retrieved
## Related Rules (from 05-rules.md)
- Use Structured Output for Citations
## Related Skills
- Implement RAG Pipeline with Similarity Search
- Implement Cross-Encoder Reranking for RAG
- Create a Single-Responsibility Agent Class
## Success Criteria
- Every RAG response includes validated citations for each claim
- Citation fabrication rate < 1% (validated post-generation)
- Users can trace each claim back to source document
- Citation statistics provide quality signal for retrieval improvement
