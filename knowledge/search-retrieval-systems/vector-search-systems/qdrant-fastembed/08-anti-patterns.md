# Anti-Patterns: Qdrant FastEmbed Integration

## Metadata

| | |
|---|---|
| **KU ID** | K053 |
| **Subdomain** | vector-similarity-search |
| **Topic** | Qdrant FastEmbed Integration |
| **Source** | Qdrant Docs |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | shell_exec for FastEmbed Instead of HTTP Microservice | Reliability | High |
| 2 | Always Using Large Model Unnecessarily | Design | Medium |
| 3 | No Cache for FastEmbed Embeddings | Performance | Medium |
| 4 | Per-Document API Calls Instead of Batch Inference | Performance | High |

## Repository-Wide Anti-Patterns

- **Embedded Python**: Running FastEmbed directly via shell_exec instead of as a Docker sidecar
- **CPU-Bound Inference**: Running full-precision models without quantization on CPU-only hardware
- **No-Cache Pipeline**: Treating FastEmbed inference as cheap enough to skip caching

---

## 1. shell_exec for FastEmbed Instead of HTTP Microservice

**Category:** Reliability

**Description:** Calling FastEmbed via `shell_exec()` from PHP instead of running it as a dedicated HTTP microservice.

**Why It Happens:** Quickest integration path. A simple shell command works in development. The reliability issues emerge only under production load with concurrent requests.

**Warning Signs:**
- `shell_exec("python3 -m fastembed ...")` in PHP code
- PHP-FPM processes hang when Python model loads
- Multiple PHP workers spawn competing Python processes
- OOM from concurrent Python model loading
- Unreliable JSON parsing from shell output

**Why Harmful:** Each `shell_exec` spawns a new Python process with full model loading overhead (1-5 seconds). Concurrent PHP workers each start their own Python process, leading to OOM. Output parsing is fragile. There is no health monitoring, request queuing, or graceful degradation.

**Consequences:**
- Request timeouts from Python model loading latency
- OOM crashes from multiple Python processes
- Unreliable output parsing
- No monitoring or health checks
- No request queuing or rate limiting

**Alternative:** Run FastEmbed as a Docker container with an HTTP API. Laravel sends HTTP requests to the microservice.

**Refactoring Strategy:**
1. Deploy FastEmbed as a Docker service with HTTP endpoint
2. Replace shell_exec with `Http::post('http://fastembed:8000/embed', ['text' => $text])`
3. Add health check endpoint
4. Implement connection pooling and retry logic
5. Remove shell_exec code

**Detection Checklist:**
- [ ] Is FastEmbed running as an HTTP microservice?
- [ ] Are there any shell_exec calls for embedding?
- [ ] Is the FastEmbed service health-monitored?
- [ ] Are PHP and Python processes decoupled?

**Related Rules/Skills/Trees:**
- Rule: Run FastEmbed as a Separate Microservice (`05-rules.md:1-34`)
- Skill: Configure and Implement Qdrant Fastembed (`06-skills.md:1-78`)

---

## 2. Always Using Large Model Unnecessarily

**Category:** Design

**Description:** Using BAAI/bge-large-en for all workloads without evaluating whether BAAI/bge-small-en provides sufficient quality.

**Why It Happens:** Larger models are assumed to provide better quality. The quality difference between small and large models is not benchmarked. The latency and compute cost of the large model is accepted without scrutiny.

**Warning Signs:**
- Model is always `bge-large-en` without documented quality justification
- No benchmark comparing small vs large model recall
- Embedding latency is higher than needed
- CPU utilization is higher than necessary
- No model size tradeoff analysis

**Why Harmful:** bge-large-en has 2-4× the inference latency and compute cost of bge-small-en. The quality improvement is often marginal (<2% recall) for most use cases. The latency and cost penalty is paid on every embedding generation — every index operation and every real-time query.

**Consequences:**
- 2-4× higher embedding latency than necessary
- Higher CPU utilization on the FastEmbed service
- Slower bulk indexing throughput
- No measurable quality improvement

**Alternative:** Start with bge-small-en. Benchmark recall against bge-large-en. Only upgrade if quality improvement justifies the latency cost.

**Refactoring Strategy:**
1. Benchmark recall with bge-small-en on production queries
2. Test with bge-large-en and compare recall
3. If improvement is marginal (<2%), keep small model
4. If improvement is significant, evaluate cost-benefit

**Detection Checklist:**
- [ ] Is the smallest effective model being used?
- [ ] Was recall benchmarked against larger models?
- [ ] Is the model choice documented with rationale?
- [ ] Is embedding latency monitored?

**Related Rules/Skills/Trees:**
- Rule: Use Appropriate Model Size for Speed/Quality (`05-rules.md:36-67`)

---

## 3. No Cache for FastEmbed Embeddings

**Category:** Performance

**Description:** Calling FastEmbed inference for every text without caching, recomputing embeddings for identical content.

**Why It Happens:** FastEmbed has no per-call cost (unlike API embeddings), so caching feels less critical. Developers overlook the CPU cost of redundant inference.

**Warning Signs:**
- Same text sent to FastEmbed multiple times
- No cache store configured for embeddings
- FastEmbed service CPU utilization is higher than necessary
- Queue retries recompute embeddings from scratch

**Why Harmful:** FastEmbed inference consumes CPU time (5-50ms per text). Caching eliminates redundant computation, freeing CPU for actual work. At scale, redundant inference can saturate the FastEmbed service CPU, causing queuing and latency.

**Consequences:**
- Wasted CPU cycles on redundant inference
- Higher latency for repeated content
- FastEmbed service CPU saturation from redundant work
- Slower bulk indexing

**Alternative:** Cache FastEmbed results by content hash using Redis before calling the inference service.

**Refactoring Strategy:**
1. Add cache check before FastEmbed HTTP call
2. Key by `md5($text . $model . $dimensions)`
3. Skip inference on cache hit
4. Monitor cache hit rate

**Detection Checklist:**
- [ ] Are FastEmbed results cached by content hash?
- [ ] Is cache hit rate monitored?
- [ ] Is FastEmbed CPU utilization reduced by caching?

**Related Rules/Skills/Trees:**
- Rule: Cache Embeddings Aggressively (`05-rules.md:69-100`)

---

## 4. Per-Document API Calls Instead of Batch Inference

**Category:** Performance

**Description:** Sending one text at a time to FastEmbed for bulk processing instead of batching multiple texts into a single inference call.

**Why It Happens:** Simple foreach loop is the most obvious implementation. Batching requires collecting texts and handling response mapping. The loop is written first and never optimized.

**Warning Signs:**
- Bulk indexing sends one text per FastEmbed HTTP call
- FastEmbed service receives many individual requests
- Throughput is measured in docs/second (low)
- FastEmbed service CPU is underutilized (model overhead per call)
- Network overhead dominates inference time

**Why Harmful:** FastEmbed processes batched texts more efficiently due to model parallelism and reduced per-request overhead. Processing 32 texts in one batch takes less total time than 32 individual calls. The overhead difference is significant at scale — batches of 32 can achieve 10-20× throughput improvement.

**Consequences:**
- 5-10× slower bulk indexing than batched approach
- Higher network overhead (many HTTP connections)
- FastEmbed service underutilized (idle between requests)
- Longer indexing windows

**Alternative:** Collect texts into batches (32-64 texts) and send as a single FastEmbed batch inference call.

**Refactoring Strategy:**
1. Identify bulk embedding loops
2. Collect texts into configurable batch sizes
3. Use FastEmbed batch endpoint
4. Map response embeddings by position
5. Process batch results

**Detection Checklist:**
- [ ] Are bulk embedding calls batched?
- [ ] Is batch size configurable?
- [ ] Is bulk throughput measured and optimized?
- [ ] Are individual calls avoided during batch processing?

**Related Rules/Skills/Trees:**
- Rule: Batch Embedding Requests for Throughput (`05-rules.md:102-133`)
