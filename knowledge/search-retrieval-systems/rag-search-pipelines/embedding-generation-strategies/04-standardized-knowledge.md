| Metadata | |
|---|---|
| KU ID | K067 |
| Subdomain | rag-search-pipelines |
| Topic | Embedding Generation Strategies |
| Source | OpenAI / Local / General |
| Maturity | New |

## Overview

Embedding generation converts text into vector representations for semantic search. Strategies differ by provider (OpenAI, Cohere, Voyage), deployment (API vs local), model size, and dimensionality (256-3072). For Laravel, API-based embeddings (OpenAI) are most common; local models (FastEmbed) optimize costs at scale.

## Core Concepts

- **API Embeddings**: OpenAI `text-embedding-3-*`, Cohere `embed-*` — pay-per-token, high quality, zero infra
- **Local Embeddings**: FastEmbed, sentence-transformers — on-device, free, lower quality
- **Dimensionality**: Higher (3072) captures more info but increases storage/compute
- **Normalization**: Most models produce unit vectors for cosine similarity
- **Matryoshka Models**: Support dimensionality truncation without quality loss

## When To Use

- Any vector search or RAG pipeline
- Semantic search beyond keyword matching
- API-based for quick start, local for air-gapped or cost optimization

## When NOT To Use

- For exact keyword matching only (use traditional FTS)
- When documents are very short (<50 tokens) — embedding quality degrades
- When latency requirements preclude API calls (<20ms search)

## Best Practices

1. **Cache all generated embeddings** — never re-embed the same text
2. **Batch API calls** — providers offer batch endpoints for lower per-token cost
3. **Use the smallest effective model** — text-embedding-3-small is sufficient for most use cases
4. **Monitor costs** — high-volume indexing can generate significant API charges
5. **Handle rate limits** with retry logic and exponential backoff

## Architecture Guidelines

- Cache embeddings by text content hash
- Separate embedding from search infrastructure for independent scaling
- Use Matryoshka models for flexible dimensionality
- Implement fallback to keyword-only search when embedding API is unavailable

## Performance Considerations

- API embedding latency: 50-200ms per call, batch for efficiency
- Local CPU: 10-50ms; GPU: 2-10ms
- Embedding at index time vs query time — cache aggressively at index time
- Dimensionality reduction directly reduces storage and search compute

## Security Considerations

- API embeddings send text to third-party providers — evaluate for sensitive data
- Local embeddings keep data on-premises
- Implement embedding access controls for multi-tenant vector stores

## Common Mistakes

- Re-embedding on every update — cache by content hash instead
- Using the largest model unnecessarily — 3072 dims rarely needed over 1536
- Not normalizing embeddings — cosine distance on unnormalized vectors gives incorrect results
- Embedding without text preprocessing — HTML, normalization, truncation

## Anti-Patterns

- **No caching**: Re-embedding the same text repeatedly at significant cost
- **Maximum dimensions always**: Using 3076 dimensions for simple use cases
- **Ignore rate limits**: No backoff strategy causing failed indexing pipelines
- **Skip preprocessing**: Embedding raw HTML or malformed text

## Examples

```php
// Cache embeddings by content hash
$hash = md5($text);
$embedding = Cache::remember("embedding:$hash", 86400 * 30, function () use ($text) {
    return OpenAI::embeddings()->create([
        'model' => 'text-embedding-3-small',
        'input' => $text,
    ])->embeddings[0]->embedding;
});

// Batch multiple texts
$response = OpenAI::embeddings()->create([
    'model' => 'text-embedding-3-small',
    'input' => ['text 1', 'text 2', 'text 3'],
]);
```

## Related Topics

- K068 (Chunking strategies for RAG)
- K069 (RAG pipeline architecture)
- K053 (Qdrant FastEmbed)
- K067 (Embedding caching)

## AI Agent Notes

- OpenAI text-embedding-3-small (1536 dims) is the recommended starting point for most applications
- Cache embeddings aggressively — this is the #1 cost optimization
- For agents: use content-hash caching, batch API calls, implement fallback to keyword search
