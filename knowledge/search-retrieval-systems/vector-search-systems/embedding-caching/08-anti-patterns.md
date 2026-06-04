# Anti-Patterns: Embedding Caching

## Metadata

| | |
|---|---|
| **KU ID** | ku-09 |
| **Subdomain** | vector-similarity-search |
| **Topic** | Embedding Caching |
| **Source** | Industry |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | No Embedding Cache at All | Performance | High |
| 2 | Cache Key Missing Model/Dimensionality | Maintainability | High |
| 3 | No Cache Invalidation on Content Change | Reliability | Medium |
| 4 | Wrong Cache Store for Access Pattern | Performance | Medium |

## Repository-Wide Anti-Patterns

- **Cache-Naive Embedding Pipeline**: Generating embeddings from scratch for every indexing operation, treating API calls as free
- **Text-Only Cache Key**: Using only `md5($text)` as the cache key, causing silent collisions when the embedding model or dimensionality changes
- **Cache-TTL-Only Strategy**: Using short TTLs instead of content-based invalidation, causing unnecessary re-embedding of unchanged content

---

## 1. No Embedding Cache at All

**Category:** Performance

**Description:** Generating embeddings from scratch every time content is processed, without caching previously generated embeddings by content hash.

**Why It Happens:** Initial implementations embed content once during bulk import, making caching seem unnecessary. As the system grows, content gets re-processed through queue retries, webhook-triggered updates, and full re-indexing. Each reprocessing regenerates embeddings.

**Warning Signs:**
- Embedding API costs scale with total processing volume, not unique content
- Same content embedded dozens of times in logs
- Re-indexing operations regenerate embeddings for unchanged content
- Queue retries cause redundant embedding calls
- No cache store (Redis/database) is configured for embeddings

**Why Harmful:** Embedding generation is expensive in both cost (API per-token pricing) and latency (100-500ms per API call). Without caching, the same content embedded N times costs N× the same amount. For systems with recurring content (daily crawls, webhook re-processing, queue failures), this waste compounds significantly.

**Consequences:**
- API costs 2-10× higher than necessary
- Indexing latency higher from redundant API calls
- Higher rate-limit contention causing more retries
- Slower queue processing from redundant work

**Alternative:** Always cache embeddings by content hash before writing to the vector store. Use a persistent cache (database or Redis) keyed by `md5(text . model . dimensions)`.

**Refactoring Strategy:**
1. Add content hashing before every embedding call
2. Check cache before calling embedding API
3. Store new embeddings keyed by content hash after generation
4. Set cache hit/miss monitoring

**Detection Checklist:**
- [ ] Is embedding generation gated by a cache check?
- [ ] Is the cache hit rate monitored?
- [ ] Are queue retries served from cache?
- [ ] Does re-indexing skip unchanged content?

**Related Rules/Skills/Trees:**
- Rule: Always Cache Generated Embeddings (`05-rules.md:1-39`)

---

## 2. Cache Key Missing Model/Dimensionality

**Category:** Maintainability

**Description:** Using only the input text hash as the cache key, so changing the embedding model or dimensionality returns stale cached embeddings from the old model.

**Why It Happens:** Developers hash the input text without considering that the same text produces different vectors from different models. The cache works correctly during development (single model), but breaks when models are upgraded or switched.

**Warning Signs:**
- Cache key is `md5($text)` without model or dimension info
- Changing the embedding model has no effect (old cache hits persist)
- Different models return identical cached vectors for same text
- Model upgrade produces no change in stored embeddings
- Cache flush is required after every model change

**Why Harmful:** Without model and dimensionality in the cache key, upgrading the embedding model silently returns old vectors. The new model's quality improvements are completely nullified because the cache serves vectors from the previous model. This bug is hard to detect because vectors look structurally correct — they are just from the wrong model.

**Consequences:**
- Model upgrades have no effect on search quality
- Silent data corruption: wrong-model vectors in the index
- Time wasted debugging "why model upgrade didn't improve search"
- Cache flush required for every model change (defeating caching purpose)
- Hard to detect: no error, just stale data

**Alternative:** Include model name and dimensionality in the cache key: `md5($text . '|' . $model . '|' . $dimensions)`.

**Refactoring Strategy:**
1. Update cache key generation to include model + dimensions
2. Flush old cache entries (they have wrong keys)
3. Verify cache hits change after model upgrade
4. Add migration test that confirms model change produces different keys

**Detection Checklist:**
- [ ] Does the cache key include model name and dimensionality?
- [ ] Does a model change produce different cache keys?
- [ ] Is cache flushed when model configuration changes?
- [ ] Are integration tests verifying model change affects cached vectors?

**Related Rules/Skills/Trees:**
- Rule: Include Model and Dimensionality in Cache Key (`05-rules.md:41-70`)

---

## 3. No Cache Invalidation on Content Change

**Category:** Reliability

**Description:** Caching embeddings indefinitely without invalidating them when the source content changes, causing vector search to return results based on outdated content.

**Why It Happens:** Developers focus on the write path (cache new embeddings) but forget the update path (invalidate old ones). The cache has no invalidation logic, so updated content still returns old vectors. The search system silently serves stale results.

**Warning Signs:**
- Content updates do not trigger cache invalidation
- Vector search returns results that contradict current content
- No `Cache::forget()` or `Cache::pull()` call in update/delete handlers
- Cache TTL is the only invalidation mechanism (stale until expiry)
- Users find outdated search results after content edits

**Why Harmful:** Stale embeddings cause vector search to return semantically irrelevant results based on old content. The user updates a document's meaning, but search ranks it based on its previous meaning. In RAG pipelines, this means the LLM receives outdated context. The bug is silent — no error, just incorrect results.

**Consequences:**
- Search returns outdated results after content edits
- RAG pipelines provide wrong context to LLMs
- User trust erodes when search doesn't reflect recent changes
- Debugging difficulty: results look "mostly correct" but subtly wrong

**Alternative:** Invalidate the embedding cache whenever the source content changes. Use model events (creating/updated) to clear the old cache key and re-embed.

**Refactoring Strategy:**
1. Add cache invalidation to model update/delete events
2. Compute old content hash before update, forget cache key
3. Re-embed new content during the update transaction
4. Test: update content, verify new embedding in search results

**Detection Checklist:**
- [ ] Is cache invalidated when source content changes?
- [ ] Do model events trigger cache invalidation?
- [ ] Is the old content hash computed before the update?
- [ ] Are integration tests verifying correct behavior after content edits?

**Related Rules/Skills/Trees:**
- Rule: Invalidate Cache When Source Content Changes (`05-rules.md:103-137`)

---

## 4. Wrong Cache Store for Access Pattern

**Category:** Performance

**Description:** Using a slow cache store (filesystem, database without indexing) for query-time embedding lookups, adding unnecessary latency to every search query.

**Why It Happens:** The default Laravel cache driver (file) is used for embeddings. Embeddings are large (6KB per 1536-dim vector), and filesystem reads for multiple embeddings add up. The cache store choice is not evaluated for query-time read performance.

**Warning Signs:**
- Cache driver is `file` or `database` for embedding cache
- Query-time cache reads add 5-50ms latency
- Cache read time exceeds embedding computation time
- No cache driver evaluation document exists
- Redis is used for other caching but not for embeddings

**Why Harmful:** Query-time embedding cache reads should be sub-millisecond. Filesystem reads for 6KB+ serialized vectors add significant latency per query. At high QPS, filesystem I/O becomes a bottleneck. Database cache reads add query overhead to the primary database. The latency from slow cache reads negates the benefit of caching.

**Consequences:**
- 5-50ms added to every search query from cache reads
- Filesystem I/O becoming a performance bottleneck
- Database load from embedding cache queries
- Missed opportunity for near-zero latency with Redis

**Alternative:** Use Redis for query-time embedding cache (sub-millisecond reads). Use database or filesystem only for offline batch processing where read latency is less critical.

**Refactoring Strategy:**
1. Evaluate query-time cache read latency with current driver
2. Switch to Redis for embedding cache in production
3. Keep database/filesystem as fallback for cold-start warming
4. Monitor cache read latency in production

**Detection Checklist:**
- [ ] Is the embedding cache stored in Redis (not file/database)?
- [ ] Are query-time cache reads sub-millisecond?
- [ ] Is there a fallback cache store for cold starts?
- [ ] Is cache read latency monitored?

**Related Rules/Skills/Trees:**
- Rule: Use Redis for Query-Time Cache (`05-rules.md:72-101`)
