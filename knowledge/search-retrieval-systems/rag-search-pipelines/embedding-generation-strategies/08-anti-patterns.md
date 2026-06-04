# Anti-Patterns: Embedding Generation Strategies

## Metadata

| | |
|---|---|
| **KU ID** | K067 |
| **Subdomain** | rag-search-pipelines |
| **Topic** | Embedding Generation Strategies |
| **Source** | OpenAI / Local / General |
| **Maturity** | New |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 14-rag-search-pipelines |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | No Caching | Performance | High |
| 2 | Maximum Dimensions Always | Performance | Medium |
| 3 | Ignore Rate Limits | Reliability | High |
| 4 | Skip Preprocessing | Quality | Medium |

## Repository-Wide Anti-Patterns

- **Re-Embedding Everything**: Generating embeddings repeatedly for identical text without content-hash caching
- **Largest-Model-All-The-Time**: Using maximum dimensionality embeddings for every use case regardless of need
- **Raw-Text Embedding**: Embedding unprocessed HTML, malformed text, or unnormalized input

---

## 1. No Caching

**Category:** Performance

**Description:** Re-embedding the same text content on every indexing run or query without caching by content hash.

**Why It Happens:** Caching adds complexity. Teams implement embedding generation without considering that the same content may be encountered repeatedly.

**Warning Signs:**
- Embedding API costs are higher than expected
- Same text is embedded multiple times (e.g., on re-indexing)
- Indexing pipeline runs are slow due to repeated API calls

**Why Harmful:** Embedding API calls cost money and add latency. Identical content embedded N times costs N× the API price. For large indexing pipelines, this can multiply costs by 10-100×.

**Consequences:**
- Unnecessarily high API costs
- Slow indexing from redundant API calls
- Rate limit hits from avoidable duplicate requests

**Alternative:** Cache embeddings by content hash (MD5, SHA256). Store generated embeddings with a TTL or indefinitely.

**Refactoring Strategy:**
1. Generate content hash before embedding
2. Check cache before calling API
3. Store new embeddings with content hash as key
4. Set cache invalidation based on content update frequency

**Detection Checklist:**
- [ ] Are embeddings cached by content hash?
- [ ] Is the same text embedded more than once?
- [ ] Is cache hit rate monitored?

**Related Rules/Skills/Trees:**
- Rule: Cache All Generated Embeddings (`04-standardized-knowledge.md:35-36`)

---

## 2. Maximum Dimensions Always

**Category:** Performance

**Description:** Always using the largest available embedding dimensionality (e.g., 3072 for text-embedding-3-large) regardless of use case requirements.

**Why It Happens:** "Bigger is better" mentality. Teams assume higher dimensions capture more information and provide better results.

**Warning Signs:**
- Using text-embedding-3-large (3072 dims) for simple document search
- No dimensionality testing or reduction attempted
- Vector storage costs are unnecessarily high

**Why Harmful:** Higher dimensions increase storage costs (2× for 3072 vs 1536), slow down search, require more RAM, and often provide negligible quality improvement over smaller models.

**Consequences:**
- 2-4× higher storage and memory costs
- Slower vector search due to higher dimensionality
- No measurable quality benefit for most use cases

**Alternative:** Start with text-embedding-3-small (1536 dimensions). Use Matryoshka models that support dimensionality truncation. Only increase dimensions if benchmarks show meaningful improvement.

**Refactoring Strategy:**
1. Test text-embedding-3-small vs large on your benchmark
2. If small is within 95% of large, use small
3. Consider Matryoshka truncation for flexible dimensionality

**Detection Checklist:**
- [ ] Is the smallest effective model being used?
- [ ] Are dimensionality tradeoffs benchmarked?
- [ ] Is vector storage cost optimized?

**Related Rules/Skills/Trees:**
- Rule: Use Smallest Effective Embedding Model (`04-standardized-knowledge.md:37-38`)

---

## 3. Ignore Rate Limits

**Category:** Reliability

**Description:** Sending embedding API requests without retry logic or rate limit handling, causing failed indexing pipelines.

**Why It Happens:** Rate limits are not visible during development with small volumes. They only appear under production indexing loads.

**Warning Signs:**
- Embedding pipeline fails intermittently during bulk indexing
- API returns 429 errors
- No retry logic or exponential backoff implemented

**Why Harmful:** Rate limit errors can stall the entire indexing pipeline, requiring manual restart. Without backoff, retries may compound the problem.

**Consequences:**
- Failed bulk indexing jobs requiring manual intervention
- Partial indexing with missing embeddings
- Increased support burden from failed pipelines

**Alternative:** Implement exponential backoff with retry for all embedding API calls. Queue embedding jobs to control throughput.

**Refactoring Strategy:**
1. Add retry logic with exponential backoff (1s, 2s, 4s, 8s)
2. Configure max retries (3-5) with dead-letter queue on failure
3. Rate-limit embedding requests to stay within API tiers

**Detection Checklist:**
- [ ] Is retry logic implemented for embedding API calls?
- [ ] Are rate limits monitored and respected?
- [ ] Do indexing jobs fail safely with retry?

**Related Rules/Skills/Trees:**
- Rule: Implement Retry Logic for Embedding APIs (`04-standardized-knowledge.md:39-40`)

---

## 4. Skip Preprocessing

**Category:** Quality

**Description:** Embedding raw text without preprocessing — including HTML tags, markdown formatting, malformed content, or excessively long text.

**Why It Happens:** Text extraction seems straightforward. Teams assume the source text is already clean and ready for embedding.

**Warning Signs:**
- HTML tags visible in embedded text
- Embedding quality differs between cleaned and raw versions
- Embedding API returns warnings about input length

**Why Harmful:** HTML, markdown, and formatting artifacts add noise to embeddings. The vector representation captures formatting tokens instead of semantic content, reducing retrieval quality.

**Consequences:**
- Poor semantic matching due to noisy embeddings
- Wasted embedding tokens on formatting (higher costs)
- Inconsistent quality between documents with different formatting

**Alternative:** Clean text before embedding: strip HTML, normalize whitespace, truncate to model limits, handle special characters.

**Refactoring Strategy:**
1. Add text preprocessing step before embedding (strip HTML, normalize)
2. Truncate input to model max tokens (with warning logging)
3. Validate text quality post-cleaning before embedding

**Detection Checklist:**
- [ ] Is text preprocessed before embedding?
- [ ] Are HTML/markdown tags removed?
- [ ] Is input length validated against model limits?

**Related Rules/Skills/Trees:**
- Rule: Preprocess Text Before Embedding (`04-standardized-knowledge.md:39-40`)
