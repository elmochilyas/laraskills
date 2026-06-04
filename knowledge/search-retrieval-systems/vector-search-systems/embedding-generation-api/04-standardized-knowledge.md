| Metadata | |
|---|---|
| KU ID | ku-08 |
| Subdomain | vector-similarity-search |
| Topic | API Embedding Generation |
| Source | OpenAI / Cohere / Voyage docs |
| Maturity | Stable |

## Overview

API embedding generation uses cloud provider models to convert text to vectors. OpenAI text-embedding-3-* models are the most common. API embeddings offer the best quality, require zero infrastructure, but incur per-token costs and add network latency.

## Core Concepts

- **OpenAI**: 	ext-embedding-3-small (1536d, .02/1M), 	ext-embedding-3-large (3072d, .13/1M)
- **Cohere**: embed-english-v3.0, embed-multilingual-v3.0
- **Voyage**: Domain-specific models (code, finance, medical)
- **Dimensionality**: Matryoshka models support truncation without quality loss
- **Batching**: API providers offer batch endpoints for lower per-token cost
- **Rate Limits**: API calls per minute (RPM) and tokens per minute (TPM) limits

## When To Use

- Starting new vector search implementation
- Best-quality embeddings needed
- Low-to-moderate embedding volume
- Rapid prototyping before scaling with local models

## When NOT To Use

- Very high-volume embedding (costs add up)
- Privacy-sensitive data cannot leave server
- Air-gapped environments
- Latency-critical applications (network round-trip)

## Best Practices

1. **Cache all embeddings**: Never re-embed the same text — store by content hash.
2. **Use smallest effective model**: text-embedding-3-small sufficient for most.
3. **Batch API calls**: Reduce cost and improve throughput.
4. **Implement rate limiting**: Exponential backoff on 429 responses.
5. **Monitor costs**: Set up usage alerts at provider dashboard.
6. **Use Matryoshka truncation**: Use 1536 dims from 3072 model if quality allows.

## Related Topics

- K067 (Embedding generation strategies)
- K069 (RAG pipeline)
- K053 (Qdrant FastEmbed)

## AI Agent Notes

- OpenAI text-embedding-3-small is the standard default
- API costs are significant only at high volume (>1M documents)
- For agents: start with API, cache aggressively, plan for local at scale

## Verification

- [ ] API provider configured
- [ ] API key secured in .env
- [ ] Embedding caching implemented
- [ ] Batching for bulk processing
- [ ] Rate limit handling (retry, backoff)
- [ ] Cost monitoring in place
- [ ] Dimensionality chosen correctly
