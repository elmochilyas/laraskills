# Anti-Patterns: API Embedding Generation

## Metadata

| | |
|---|---|
| **KU ID** | ku-08 |
| **Subdomain** | vector-similarity-search |
| **Topic** | API Embedding Generation |
| **Source** | OpenAI / Cohere / Voyage docs |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | No Caching of API Embeddings | Performance | High |
| 2 | Using Largest Model by Default | Scalability | Medium |
| 3 | One-at-a-Time API Calls for Bulk Processing | Performance | High |
| 4 | No Rate Limit Retry Logic | Reliability | High |
| 5 | No Cost Monitoring | Scalability | Medium |

## Repository-Wide Anti-Patterns

- **API-Forever Mindset**: Using API embedding generation at scale without planning migration to local models
- **Large-Model-Is-Better Fallacy**: Choosing `text-embedding-3-large` without benchmarking improvement over `small`
- **API-Key-in-Code**: Embedding API credentials hardcoded instead of in environment variables

---

## 1. No Caching of API Embeddings

**Category:** Performance

**Description:** Calling the embedding API for every text without caching, regenerating embeddings for identical content on every request.

**Why It Happens:** Initial implementation skips caching for simplicity. The cost seems negligible at low volume. As the system grows, API costs compound without visibility.

**Warning Signs:**
- Same text embedded multiple times in API logs
- No cache store configured for embeddings
- API costs grow linearly with processing frequency, not unique content
- Re-indexing regenerates embeddings for unchanged content

**Why Harmful:** API embedding costs ($0.02-0.13 per million tokens) add up at scale. Caching eliminates redundant costs entirely for repeated content. Without caching, every queue retry, webhook, and re-indexing operation pays the same cost again.

**Consequences:**
- Unnecessary API costs accumulating to significant monthly expenses
- Higher indexing latency from redundant API calls
- Rate limit pressure from unnecessary calls

**Alternative:** Cache all embeddings by content hash using Redis or database before every API call.

**Refactoring Strategy:**
1. Add cache check before every API embedding call
2. Store API responses keyed by `md5($text . $model . $dimensions)`
3. Serve cached embeddings on cache hit
4. Monitor cache hit rate

**Detection Checklist:**
- [ ] Are all API embeddings cached by content hash?
- [ ] Is the cache hit rate above 50%?
- [ ] Are batch operations checking cache before API calls?
- [ ] Are API costs reduced by cache implementation?

**Related Rules/Skills/Trees:**
- Rule: Cache All Embeddings (`05-rules.md:1-39`)

---

## 2. Using Largest Model by Default

**Category:** Scalability

**Description:** Using `text-embedding-3-large` (3072 dims, 6× cost) without benchmarking whether `text-embedding-3-small` (1536 dims) provides sufficient quality.

**Why It Happens:** "Bigger is better" intuition. Larger models feel more "professional." The cost difference is small at prototype scale and only becomes significant at production volume.

**Warning Signs:**
- Model is set to `large` without documented quality benchmarks
- No A/B test comparing `small` vs `large` results
- Storage costs are higher than necessary
- Embedding costs are a significant budget line item
- Query latency is higher from larger vectors

**Why Harmful:** text-embedding-3-large costs 6× more per token, produces 2× the vector dimensions (doubling storage), and adds query latency from larger distance computations — all for marginal quality improvement that is often <1% on standard benchmarks.

**Consequences:**
- 6× unnecessary embedding costs
- 2× vector storage costs
- Higher query latency from larger distance computations
- No measurable quality improvement

**Alternative:** Start with `text-embedding-3-small`. Benchmark recall against `large`. Only upgrade if there's a statistically significant improvement on your specific data.

**Refactoring Strategy:**
1. Benchmark recall with `small` model
2. Create test with `large` model and compare recall
3. If improvement is <2%, stay with `small`
4. If improvement is significant, evaluate cost-benefit

**Detection Checklist:**
- [ ] Is the smallest effective model being used?
- [ ] Was `small` vs `large` benchmarked before choosing?
- [ ] Are embedding costs tracked per model?

**Related Rules/Skills/Trees:**
- Rule: Use Smallest Effective Model (`05-rules.md:41-69`)

---

## 3. One-at-a-Time API Calls for Bulk Processing

**Category:** Performance

**Description:** Making individual API embedding calls for each document during bulk indexing instead of batching multiple texts into a single API request.

**Why Happens:** The simplest loop embeds one document at a time. Batching requires collecting texts and handling response mapping. The loop is written first and never optimized.

**Warning Signs:**
- Bulk indexing calls embed API in a `foreach` loop
- API logs show many individual requests instead of batch requests
- Bulk indexing throughput is measured in docs/second, not tokens/second
- Rate limits are hit frequently during bulk processing
- API costs are higher than expected due to per-request overhead

**Why Harmful:** API providers charge per token and have per-request overhead. Batching 100 texts into one request costs the same as 100 individual requests for tokens but saves 99× the request overhead. Batching also stays within rate limits more easily and completes faster.

**Consequences:**
- Higher API costs from per-request overhead
- Slower bulk indexing (serial requests instead of parallel batch)
- Rate limits hit more frequently, causing retries
- Unnecessarily long indexing windows

**Alternative:** Collect texts into batches of 100-500 and send as a single API request. Map response embeddings back to documents by index position.

**Refactoring Strategy:**
1. Identify bulk embedding loops
2. Collect texts into batches (configurable batch size)
3. Send batch API request
4. Map response embeddings by position
5. Process batch results

**Detection Checklist:**
- [ ] Are bulk embedding calls batched (not per-document)?
- [ ] Is batch size configurable?
- [ ] Are API logs showing batch requests?
- [ ] Is bulk throughput measured and optimized?

**Related Rules/Skills/Trees:**
- Rule: Batch API Calls for Bulk Processing (`05-rules.md:71-109`)

---

## 4. No Rate Limit Retry Logic

**Category:** Reliability

**Description:** Not implementing retry logic with exponential backoff for rate-limited (HTTP 429) API embedding calls, causing silent embedding failures and indexing gaps.

**Why It Happens:** The happy path works: API responds, embedding is stored. Developers don't anticipate rate limits during development. The first 429 response silently fails if no retry logic exists.

**Warning Signs:**
- No retry/backoff logic around embedding API calls
- Documents indexed without embeddings (silent failures)
- Embedding counts differ from document counts
- No error handling for API client exceptions
- Rate limits are set at provider but not respected in code

**Why Harmful:** Without retry logic, a rate-limited embedding call returns an exception that may not be caught. The document gets indexed without an embedding — it becomes invisible to vector search. Over time, the index accumulates documents without embeddings, degrading search recall.

**Consequences:**
- Missing embeddings for a percentage of documents
- Silent search quality degradation
- Time wasted debugging "why some documents don't appear in search"
- Manual re-indexing required to fill gaps

**Alternative:** Implement retry with exponential backoff: retry 3 times with 1s, 2s, 4s delays. Log retries and alert on persistent failures.

**Refactoring Strategy:**
1. Wrap API calls in retry logic
2. Use Laravel's `retry()` helper with exponential backoff
3. Log retry attempts
4. Alert when retries exhaust (persistent rate limiting)
5. Consider rate limit tokens for production systems

**Detection Checklist:**
- [ ] Is retry logic implemented for API embedding calls?
- [ ] Are rate limit responses handled with backoff?
- [ ] Are retry attempts logged?
- [ ] Are persistent failures alerted?

**Related Rules/Skills/Trees:**
- Rule: Implement Rate Limiting with Exponential Backoff (`05-rules.md:111-144`)

---

## 5. No Cost Monitoring

**Category:** Scalability

**Description:** Not tracking API embedding costs or setting usage alerts, leading to unexpected bills as embedding volume grows.

**Why It Happens:** API costs are small during development. Teams don't set up monitoring because costs are initially negligible. As the system grows, costs creep up unnoticed until the monthly bill arrives.

**Warning Signs:**
- No usage alerts configured at API provider
- Embedding costs are not tracked in infrastructure dashboards
- Monthly embedding bill is a surprise
- No budget allocated for embedding costs
- Cost per document indexed is unknown

**Why Harmful:** API embedding costs scale linearly with volume. A pipeline processing 500K documents/day at $0.13/1M tokens for `large` model can cost $65+/day — $2K+/month. Without monitoring, this cost accumulates silently, and the first signal is the provider bill.

**Consequences:**
- Unexpected infrastructure cost overruns
- Budget surprises requiring emergency optimization
- Reactive cost cutting that may impact quality
- Inability to forecast costs for growth

**Alternative:** Set up cost monitoring and usage alerts at the embedding provider. Track cost per document and per search query. Set budget alerts at thresholds.

**Refactoring Strategy:**
1. Enable usage alerts at provider dashboard (e.g., $100/month)
2. Track embedding cost in application metrics
3. Calculate cost per indexed document
4. Set up dashboard for embedding cost trends

**Detection Checklist:**
- [ ] Are usage alerts configured at the embedding provider?
- [ ] Is cost per document tracked?
- [ ] Are embedding costs visible in infrastructure dashboards?
- [ ] Is there a budget for embedding costs?

**Related Rules/Skills/Trees:**
- Rule: Monitor API Costs (`05-rules.md:146-175`)
