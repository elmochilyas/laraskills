# Knowledge Unit: Citation-Grounded Answers

## Metadata

- **ID:** KU-026
- **Subdomain:** Retrieval-Augmented Generation (RAG)
- **Slug:** citation-grounded-answers
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Citation-grounded answers ensure LLM responses are traceable to source documents. In a RAG pipeline, the agent is instructed to cite which retrieved chunks support each claim. This builds user trust, enables verification, and provides audit trails. Implementation requires structured output schemas that include citation fields, combined with chunk metadata (source, section, page) in the context.

## Core Concepts

- **Citation field in schema**: Structured output includes `citations: array<{chunk_id: string, relevance: string}>`
- **Chunk metadata**: Each retrieved chunk carries source document, section, and position identifiers
- **Agent instruction**: "Answer based only on provided context. Cite the source for each claim."
- **Source-aware context**: Retrieved chunks include metadata fields — agent uses these for citations
- **Traceability**: Each response maps to specific chunks → specific source documents
- **Verification**: Users can cross-reference claims against cited sources

## Mental Models

- **Academic citation**: Like a research paper — every claim has a footnote pointing to the source. The LLM is the author, retrieved chunks are the references.
- **Audit trail for AI**: Like logging in financial systems — every AI claim is traceable to its evidence. Enables verification, debugging, and compliance.

## Internal Mechanics

Citation implementation:
1. Retrieve chunks with metadata (source, section, page, chunk_id)
2. Inject context as structured data: `[Source: docs/architecture.md, Section: "Caching"]` before each chunk
3. Define output schema with `citations` array
4. Agent instructions: "Cite sources for each claim using the provided chunk IDs"
5. Schema validation ensures citations reference valid chunk IDs
6. Post-processing: Verify citations exist, remove citations to chunks below score threshold

## Patterns

- **Structured citation schema**: `{answer: string, citations: [{chunk_id: string, text_snippet: string}]}`
- **Source attribution in context**: Prefix each chunk with `[Source: {metadata}]` — LLM learns to reference this
- **Citation verification post-process**: Validate `citations[].chunk_id` exists in retrieved set
- **Score-gated citation**: Only cite chunks above relevance score threshold (e.g., 0.7)
- **Inline vs. end citations**: Inline `[1]` references in answer text or structured citation array

## Architectural Decisions

- **Decision**: Structured citation array vs. inline text → Structured array in output schema. Reason: Machine-parseable, verifiable, enables citation highlighting in UI.
- **Decision**: Chunk-level vs. document-level citations → Chunk-level (specific position). Reason: Enables precise verification — "this claim comes from this paragraph, not just this document."

## Tradeoffs

- **Citation accuracy vs. verbosity**: Detailed citations (chunk_id + snippet) add tokens but increase trust
- **LLM instruction compliance**: Not all models reliably cite sources — test citation accuracy per model
- **Fabricated citations**: LLM may cite non-existent chunks — validate citations against retrieved set

## Performance Considerations

- Citation schema fields increase output tokens by 20-50%
- Citation validation post-process adds ~5-10ms per request
- Chunk metadata in context adds token overhead (negligible per chunk)

## Production Considerations

- Validate citations against actually-retrieved chunks — reject fabricated citations
- Display citations in UI as expandable references — users should be able to click through to source
- Log citation accuracy metrics (valid citations / total citations) — track over time
- Implement citation threshold — don't cite chunks below relevance score
- Handle "no citation needed" responses (greetings, clarifications) gracefully
- Test citation accuracy per model — GPT-4o cites more reliably than Mistral Large

## Common Mistakes

- Not validating citations — LLM fabricates sources ("citation hallucination")
- Over-instructing citation format — LLM spends more tokens on citation formatting than answer
- Not including chunk metadata in context — LLM can't cite what it can't identify
- Assuming all models support structured citation output equally
- Forgetting to handle responses without citations — not every answer needs a source

## Failure Modes

- **Citation hallucination**: LLM cites chunks that weren't retrieved — validate and reject
- **Missing citations**: LLM makes claims without citing — re-prompt with stronger instruction
- **Trivial citations**: LLM cites "common knowledge" without real source — hard to detect
- **Circular citation**: LLM cites its own previous output as source — ensure citations only reference ingested documents
- **Long citation chains**: Response cites 15+ chunks — context window may be exhausted

## Ecosystem Usage

- Legal document Q&A requiring source verification
- Medical/health information with mandatory citation requirements
- Enterprise knowledge bases where trust in AI responses is critical
- Compliance-mandated audit trails for AI-generated content
- Customer-facing support portals with source transparency

## Related Knowledge Units

- KU-021: RAG Pipeline with SimilaritySearch
- KU-024: Reranking
- KU-025: Hybrid Search
- KU-005: Structured Output with JSON Schema

## Research Notes

- Citation-grounded answers significantly increase user trust in AI systems (2026 UX research)
- Structured citation output is implemented via `HasStructuredOutput` with citations array in schema
- Post-processing validation is recommended — not all models respect citation instructions
- Citation accuracy degrades with model complexity — simpler models are less reliable
