| Metadata | |
|---|---|
| KU ID | K029 |
| Subdomain | rag-search-pipelines |
| Topic | Meilisearch RAG / Conversational Search |
| Source | Meilisearch Docs |
| Maturity | New |

## Overview

Meilisearch RAG enables conversational search by combining Meilisearch's hybrid search with an LLM for answer generation. When a user asks a question, Meilisearch retrieves relevant documents, and an LLM generates a grounded answer using those documents as context. Available as a Meilisearch Cloud feature or can be custom-built using the Meilisearch API.

## Core Concepts

- **Retrieval**: Meilisearch hybrid search finds relevant documents
- **Augmentation**: Retrieved documents formatted as LLM prompt context
- **Generation**: LLM produces natural language answer grounded in context
- **Grounded Answers**: LLM instructed to answer from provided context only
- **Source Attribution**: Answers can include document references

## When To Use

- Document Q&A over indexed knowledge bases
- Product Q&A for e-commerce catalogs
- Customer support FAQ from indexed documentation
- Enterprise knowledge search requiring natural language answers

## When NOT To Use

- When simple search results (not generated answers) are sufficient
- When LLM API costs are prohibitive
- When sub-second response times are critical (generation adds 500-3000ms)
- For applications requiring 100% factual accuracy with no hallucination risk

## Best Practices

1. **Configure LLM provider** with proper API key management
2. **Monitor costs** — each RAG query consumes LLM tokens; set budget alerts
3. **Tune retrieval parameters** to ensure sufficient context for generation
4. **Implement streaming** for better UX (reduces perceived latency)
5. **Test retrieval quality first** — poor retrieval produces poor answers

## Architecture Guidelines

- Requires Meilisearch Cloud subscription for native RAG
- Custom implementation: use Meilisearch hybrid search → format prompt → call LLM API
- Include source citations in generated answers
- Implement fallback to raw search results when LLM is unavailable

## Performance Considerations

- Total latency = retrieval (50-200ms) + generation (500-3000ms)
- Generation dominates latency — stream responses for perceived speed
- Embedding generation adds ~50-100ms per query if not cached

## Security Considerations

- LLM API keys must be securely stored
- Retrieved context may contain sensitive data — ensure access controls
- Implement prompt injection protection for user queries
- Monitor LLM output for harmful content

## Common Mistakes

- Expecting RAG to fix poor retrieval — answer quality is bounded by retrieval recall
- Not including source citations — users cannot verify AI-generated answers
- Using insufficient context — small context windows limit answer quality
- Not handling out-of-scope questions — LLM should say "I don't know" instead of hallucinating

## Anti-Patterns

- **Blind optimism**: Assuming RAG prevents all hallucination without testing
- **No citations**: Returning AI answers without source references
- **Over-retrieval**: Sending too many chunks exceeding LLM context window
- **Missing fallback**: No graceful degradation when LLM is unavailable

## Examples

```
// Meilisearch Cloud RAG query
POST /indexes/products/search
{
  "q": "What is the best laptop for developers?",
  "hybrid": {
    "semanticRatio": 0.5,
    "embedder": "default"
  },
  "retrieveVectors": true,
  "rag": {
    "provider": "openai",
    "model": "gpt-4o-mini",
    "systemPrompt": "Answer using only the provided context."
  }
}
```

## Related Topics

- K028 (Meilisearch hybrid search)
- K067 (Embedding generation strategies)
- K068 (Chunking strategies for RAG)
- K069 (RAG pipeline architecture)

## AI Agent Notes

- Meilisearch RAG is the most accessible RAG in the Scout ecosystem — minimal custom code needed
- Cloud-only feature requires Meilisearch Cloud subscription
- For agents: test retrieval quality before enabling RAG; implement source citations and fallback
