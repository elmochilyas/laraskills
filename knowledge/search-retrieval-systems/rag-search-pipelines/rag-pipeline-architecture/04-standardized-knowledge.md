| Metadata | |
|---|---|
| KU ID | K069 |
| Subdomain | rag-search-pipelines |
| Topic | RAG Pipeline Architecture |
| Source | LangChain / LlamaIndex / General |
| Maturity | New |

## Overview

RAG pipeline architecture combines vector retrieval with LLM generation to answer queries based on indexed knowledge. Standard pipeline: 1) Index (chunk → embed → store), 2) Retrieve (embed query → ANN search → top-K), 3) Augment (format context + query into prompt), 4) Generate (LLM produces answer). In Laravel, custom services integrate Scout/pgvector for retrieval with HTTP clients for LLM API calls.

## Core Concepts

- **Indexing Pipeline**: Document ingestion → chunking → embedding → vector store
- **Query Pipeline**: Query → embed → ANN search → retrieve chunks → format prompt → LLM → answer
- **Hybrid Retrieval**: Keyword + vector preferred for production RAG
- **Augmentation**: Retrieved documents formatted as prompt context
- **Re-ranking**: Optional cross-encoder step to improve context quality
- **Generation**: LLM produces answer with optional source citations

## When To Use

- Question answering over custom/private knowledge bases
- Document Q&A, product Q&A, customer support
- Any scenario requiring natural language answers grounded in indexed data

## When NOT To Use

- When simple search results suffice (no generation needed)
- When LLM latency (500-5000ms) is unacceptable
- When budget cannot support per-query LLM costs
- When 100% factual accuracy is required without verification

## Best Practices

1. **Monitor retrieval quality** — if LLM says "no relevant context found," improve retrieval
2. **Implement citations** — always include source references in answers
3. **Handle out-of-scope queries** — LLM should say "I don't know" instead of hallucinating
4. **Stream responses** for better UX with generation latency
5. **Test with adversarial queries** — ensure no prompt injection or harmful content
6. **Set up fallback** — return raw search results if LLM is unavailable

## Architecture Guidelines

- Build as a custom Laravel service: Scout/pgvector for retrieval, HTTP clients for LLM APIs
- Separate indexing pipeline (offline/batch) from query pipeline (online/realtime)
- Use hybrid retrieval for production-grade recall
- Implement caching at every stage: embeddings, query results, generation

## Performance Considerations

- Total latency = embedding (50-200ms) + retrieval (10-100ms) + optional re-ranking (50-200ms) + generation (500-5000ms)
- Generation dominates — streaming reduces perceived latency
- Hybrid retrieval adds latency (two searches) but increases recall
- Cache frequent query embeddings to reduce pipeline latency

## Security Considerations

- Implement prompt injection protection for user queries
- Apply document-level access controls before passing context to LLM
- LLM API keys require secure storage
- Monitor for data leakage in generated responses
- Rate-limit RAG endpoints to control API costs

## Common Mistakes

- Not testing retrieval quality before adding generation
- Using insufficient context — single retrieved chunk is rarely enough
- Overloading context — 20+ chunks exceed context windows
- Not instructing LLM to answer from context only — leads to hallucination
- Ignoring prompt injection risks

## Anti-Patterns

- **Skip retrieval testing**: Adding LLM before validating retrieval quality
- **No access controls**: Passing un-filtered context to LLM from multi-tenant systems
- **Infinite context**: Retrieving too many chunks exceeding LLM limits
- **No fallback**: RAG pipeline fails entirely when LLM is unavailable

## Examples

```php
// Laravel RAG pipeline service
class RAGPipelineService
{
    public function answer(string $query): RAGResponse
    {
        $queryEmbedding = $this->embed($query);
        $chunks = $this->vectorStore->similaritySearch($queryEmbedding, topK: 5);
        $context = $this->formatContext($chunks);
        $answer = $this->llm->generate($context, $query);
        return new RAGResponse($answer, $chunks);
    }
}
```

## Related Topics

- K067 (Embedding generation strategies)
- K068 (Chunking strategies for RAG)
- K029 (Meilisearch RAG)
- K062 (Cross-encoder re-ranking)
- K061 (RRF - Reciprocal Rank Fusion)

## AI Agent Notes

- RAG is the standard architecture for AI-powered search in Laravel
- Typically built as custom services — no first-party Laravel RAG package exists
- For agents: implement as a service class with separate indexing and query pipelines; always include citations and fallback
