# Skill: Implement Context Injection and Prompt Design for RAG
## Purpose
Format and inject retrieved documents into LLM prompts with clear delimiters, source metadata, relevance ordering, and token budget management for optimal grounded generation.
## When To Use
- Every RAG system — context formatting is as important as retrieval quality
- When improving RAG response quality after initial implementation
- When debugging cases where the LLM ignores retrieved context
## When NOT To Use
- Non-RAG LLM calls where no external context is needed
## Prerequisites
- RAG pipeline producing retrieved document chunks with metadata
- Understanding of LLM context window limits
- System prompt template for the RAG agent
## Inputs
- Retrieved document chunks with content + metadata (source URL, title, score)
- User query
- Token budget for context (30-70% of context window)
- System prompt template with RAG instructions
## Workflow (numbered)
1. Allocate token budget for retrieved context (30-70% of context window, leaving room for instructions and response)
2. Order retrieved documents by relevance score (most relevant first — LLM pays more attention to early content)
3. Format each document with clear delimiters (XML tags or numbered markdown blocks)
4. Include source metadata (title, URL, score) in each document's delimiter block
5. Instruct LLM explicitly: "Answer based only on the provided context. Cite sources. If context lacks answer, say you don't know."
6. Add negative instruction to prevent hallucination on missing information
7. Truncate low-relevance documents when context budget is exceeded
8. Handle empty retrieval case with explicit "I don't know" instructions
## Validation Checklist
- [ ] Context token budget configured (30-70% of context window)
- [ ] Documents ordered by relevance score (most relevant first)
- [ ] Each document wrapped in clear delimiters with source metadata
- [ ] System prompt instructs LLM to use context and cite sources
- [ ] Negative instruction prevents hallucination when context is insufficient
- [ ] Empty retrieval case handled with "I don't know" response
- [ ] Context truncated when budget exceeded (lowest-relevance documents removed)
- [ ] Multi-document synthesis instructions present when applicable
## Common Failures
- Dumping raw chunks without structure — LLM cannot distinguish or cite documents
- No token budget — context + prompt exceed window causing truncation
- No positive instruction — LLM ignores context and uses training data
- No negative instruction — LLM hallucinates when context is insufficient
- Wrong document order — most relevant documents buried in middle
## Decision Points
- **Delimiter format**: XML tags (`<document index="1">`) vs numbered blocks vs markdown separators
- **Context budget**: 30-50% for conversational RAG; 50-70% for document analysis; adjust per use case
- **Citation format**: Structured schema vs inline text citations in response
- **Multi-document synthesis**: Compare/contrast instructions vs sequential treatment
## Performance Considerations
- Context formatting: negligible CPU cost (<1ms)
- Token budget enforcement prevents context overflow errors
- More context = higher per-query cost (LLM pricing per token)
- Truncation priority: remove lowest-score documents first
## Security Considerations
- Sanitize retrieved documents for prompt injection before formatting
- Never include raw internal metadata in context (internal IDs, access control info)
- Ensure citation metadata doesn't leak sensitive document locations
- Apply PII redaction to retrieved content before injection
## Related Rules (from 05-rules.md)
- Format Retrieved Documents with Clear Delimiters
## Related Skills
- Implement RAG Architecture Pipeline
- Implement Citation-Grounded Answers in RAG
- Implement Prompt Injection Defense
## Success Criteria
- LLM consistently uses retrieved context for answers (measured via citation rate)
- No context overflow errors (token budget enforced)
- Empty retrieval produces "I don't know" responses (no hallucination)
- Documents clearly attributable with structured citation metadata
