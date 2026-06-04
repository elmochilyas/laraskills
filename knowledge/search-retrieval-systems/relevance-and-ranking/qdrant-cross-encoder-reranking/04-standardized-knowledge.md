| Metadata | |
|---|---|
| KU ID | K054 |
| Subdomain | relevance-and-ranking |
| Topic | Qdrant Re-Ranking with Cross-Encoders |
| Source | Qdrant Docs |
| Maturity | Stable |

## Overview

Qdrant supports re-ranking search results using cross-encoder models. After initial ANN retrieval, Qdrant can pass candidate results through a cross-encoder for more accurate relevance scoring. Qdrant integrates with Cohere Rerank API and supports FastEmbed on-device cross-encoder models. Re-ranking is applied as a second pass over the top-K candidates from the initial vector search.

## Core Concepts

- **Two-Stage Retrieval**: ANN search → cross-encoder re-ranking.
- **Cohere Integration**: Qdrant can call Cohere Rerank API directly.
- **FastEmbed Re-rankers**: On-device cross-encoders via FastEmbed.
- **Oversampling**: Retrieve more candidates than needed, re-rank to final count.
- **Re-ranking Strategy**: Can be configured per-collection or per-query.

## When To Use

- Production RAG pipelines needing higher retrieval accuracy
- Applications where Qdrant ANN search accuracy is insufficient
- Scenarios where cross-encoder accuracy improvement justifies latency cost
- Already using Qdrant and want to improve search quality

## When NOT To Use

- Latency-sensitive applications (re-ranking adds 50-200ms)
- Low-traffic applications where ANN accuracy is sufficient
- When re-ranking cost (API calls or server resources) is prohibitive
- Small candidate pools (<20 results) where re-ranking adds little value

## Best Practices

1. **Oversample by 2-5x**: Retrieve 50-100 candidates, re-rank to final 10-20.
2. **Choose re-ranker based on quality needs**: Cohere for highest quality, FastEmbed for on-device.
3. **Cache re-ranker results**: For frequent queries to reduce API calls.
4. **Fall back to ANN order**: If re-ranker is unavailable or times out.
5. **Monitor re-ranking latency**: Track p95 re-ranking time to detect degradation.

## Architecture Guidelines

- Configure re-ranker in Qdrant collection settings or per-query.
- For Cohere: Qdrant sends batch of (query, candidate) pairs to Cohere API.
- For FastEmbed: Qdrant uses local cross-encoder model for on-device re-ranking.
- Re-ranking is transparent — Qdrant handles the integration.

## Performance Considerations

- Re-ranking latency: 50-200ms for 20 candidates (varies by model).
- Cohere API adds network latency (calls external API).
- FastEmbed adds CPU/GPU compute but no network latency.
- Oversampling increases initial retrieval cost but improves final quality.

## Related Topics

- K048 (Qdrant vector search)
- K053 (Qdrant FastEmbed)
- K062 (Cross-encoder re-ranking)
- K069 (RAG pipeline architecture)

## AI Agent Notes

- Qdrant re-ranking integrates cross-encoders directly into the search pipeline.
- Cohere for highest quality, FastEmbed for on-device, no-external-dependency approach.
- For agents: oversample 2-5x; cache re-ranker results; implement ANN fallback.

## Verification

- [ ] Re-ranker configured (Cohere API or FastEmbed)
- [ ] Oversampling factor configured (2-5x)
- [ ] Latency budget includes re-ranking
- [ ] Fallback to ANN order implemented
- [ ] Accuracy improvement measured vs ANN-only
