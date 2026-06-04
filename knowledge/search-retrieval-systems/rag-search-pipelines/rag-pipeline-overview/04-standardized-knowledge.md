| Metadata | |
|---|---|
| Knowledge Unit ID | ku-01 |
| Subdomain | rag-search-pipelines |
| Topic | RAG Pipeline Overview |
| Source | LangChain / LlamaIndex / Industry |
| Maturity | New |

## Overview

RAG (Retrieval-Augmented Generation) combines vector retrieval with LLM generation to answer queries based on indexed knowledge. Standard pipeline: 1) Index (chunk → embed → store), 2) Retrieve (embed query → ANN search → top-K), 3) Augment (format context + query into prompt), 4) Generate (LLM produces answer). In Laravel, built as custom service integrating Scout/pgvector for retrieval and HTTP clients for LLM APIs.

## Core Concepts

- **Indexing Pipeline**: Document ingestion → chunking → embedding → vector store (offline/batch)
- **Query Pipeline**: User query → embed → ANN search → retrieve chunks → format prompt → LLM → answer
- **Retrieval**: Hybrid search (keyword + vector) preferred for production RAG
- **Augmentation**: Retrieved documents formatted into prompt instructing LLM to answer from context
- **Generation**: LLM produces answer with optional source citations
- **Re-ranking**: Optional cross-encoder step between retrieval and generation

## When To Use

- Building AI-powered search over private/custom data
- Customer support Q&A from documentation
- Enterprise knowledge base natural language access
- Product documentation conversational search

## When NOT To Use

- Simple keyword search is sufficient
- Budget for LLM API calls is not available
- Latency requirements <500ms (generation dominates)
- Privacy regulations prohibit sending data to LLM providers

## Best Practices

1. **Start with retrieval quality**: If retrieval is poor, generation will be poor.
2. **Implement citations**: Always include source document references.
3. **Handle out-of-scope queries**: LLM should say "I don't know" rather than hallucinate.
4. **Stream responses**: Use streaming for better UX with generation latency.
5. **Monitor retrieval quality**: Track "no relevant context" rate.
6. **Test with adversarial queries**: Ensure no prompt injection or harmful content.

## Architecture Guidelines

- Indexing: Batch process (queue job) → chunk → embed → store
- Query: Controller → embed query → retrieve → re-rank (optional) → augment prompt → LLM call → response
- Cache embeddings for frequent queries
- Use queue for document indexing (not inline)
- Implement fallback: if LLM unavailable, return raw search results

## Performance Considerations

- Total latency = embedding (50-200ms) + retrieval (10-100ms) + optional re-ranking (50-200ms) + generation (500-5000ms)
- Generation dominates — streaming reduces perceived latency
- Hybrid retrieval increases recall but adds latency
- Cache frequent query embeddings to reduce pipeline latency

## Security Considerations

- **Prompt injection**: User queries could attempt to manipulate LLM
- **Data privacy**: Sensitive data sent to LLM providers
- **Rate limiting**: Protect LLM API endpoints from abuse
- **Content filtering**: Ensure generated answers don't contain harmful content
- **Access control**: Retrieved documents must respect user permissions

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not testing retrieval first | Assumption retrieval works | Garbage in, garbage out | Benchmark retrieval before adding LLM |
| Insufficient context | Single chunk retrieval | LLM lacks info for good answer | Retrieve top-5 or more |
| No "answer from context" instruction | Default prompt | Hallucination risk | Explicitly instruct LLM to use only context |
| Ignoring prompt injection | Security oversight | LLM manipulation | Sanitize user input, constrain prompts |
| Not handling LLM failures | Assumption always available | 500 errors | Fallback to raw search results |

## Anti-Patterns

- **Garbage in, garbage out**: Optimizing generation before retrieval quality
- **Ignoring context window limits**: Retrieving too many chunks
- **No source attribution**: Users can't verify AI answers
- **Single chunk retrieval**: Rarely provides sufficient context
- **No streaming implementation**: Degraded UX

## Examples

`php
class RAGService
{
    public function answer(string ): RAGResponse
    {
         = EmbeddingService::embed();
         = VectorStore::search(, topK: 5);
         = ->pluck('content')->implode("\n\n");
         = "Answer the question using only the context below.\n\nContext:\n\n\nQuestion: ";
         = LLMService::generate();
        return new RAGResponse(, );
    }
}
`

## Related Topics

- K067 (Embedding generation strategies)
- K068 (Chunking strategies for RAG)
- K062 (Cross-encoder re-ranking)
- K029 (Meilisearch RAG)

## AI Agent Notes

- RAG is the standard architecture for grounding LLM responses in custom data
- Laravel lacks first-party RAG package — most implementations are custom
- LangChain PHP provides some abstractions but is less mature than Python original
- For agents: prioritize retrieval quality, implement streaming, handle failures gracefully

## Verification

- [ ] Indexing pipeline implemented (chunk → embed → store)
- [ ] Query pipeline implemented (embed → retrieve → generate)
- [ ] Retrieval quality benchmarked (>80% recall)
- [ ] Citation/source attribution implemented
- [ ] Out-of-scope query handling works
- [ ] Streaming implemented for generation
- [ ] Fallback for LLM unavailability
- [ ] Prompt injection protections in place
