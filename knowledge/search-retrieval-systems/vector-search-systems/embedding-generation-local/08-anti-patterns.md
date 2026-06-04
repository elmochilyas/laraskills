# Anti-Patterns: Local Embedding Generation

## Metadata

| | |
|---|---|
| **KU ID** | ku-07 |
| **Subdomain** | vector-similarity-search |
| **Topic** | Local Embedding Generation |
| **Source** | FastEmbed / sentence-transformers |
| **Maturity** | New |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Patterns Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | shell_exec for Python Embedding | Reliability | High |
| 2 | No Quality Benchmark Against API Baseline | Design | High |
| 3 | Full-Precision Model Without Quantization | Performance | Medium |
| 4 | No Cache for Local Embeddings | Performance | Medium |

## Repository-Wide Anti-Patterns

- **Shell-Exec Embedding**: Using `shell_exec("python3 embed.py")` instead of a proper HTTP microservice
- **API-Only Forever**: Never evaluating local models even when volume justifies the switch
- **Unquantified Quality Gap**: Assuming local model quality equals API quality without benchmarking

---

## 1. shell_exec for Python Embedding

**Category:** Reliability

**Description:** Invoking Python embedding models via `shell_exec()` or `exec()` from PHP instead of running a proper HTTP microservice.

**Why It Happens:** Quickest path to use Python models from PHP. A simple `shell_exec("python3 embed.py '$text'")` works in development. The approach is rarely robustified until it fails in production.

**Warning Signs:**
- `shell_exec`, `exec`, or `proc_open` calls for embedding
- PHP processes hang when Python model loads
- Memory limits exceeded from Python process per request
- Concurrent embedding requests spawn multiple Python processes
- JSON parsing errors from shell output

**Why Harmful:** `shell_exec` is unreliable for long-running processes: PHP times out, Python process memory is unmanaged, concurrent requests spawn competing Python processes (OOM risk), output parsing is fragile, and error handling is poor. Each embedding request spawns a new Python process with model loading overhead (1-5 seconds).

**Consequences:**
- Request timeouts when Python model loads slowly
- OOM crashes from multiple Python processes
- Unreliable JSON parsing from shell output
- No process monitoring or health checks
- No request queuing or rate limiting

**Alternative:** Run the embedding model as a separate HTTP microservice (FastEmbed, FastAPI). PHP makes HTTP calls to the microservice, which manages model lifecycle, concurrent requests, and health.

**Refactoring Strategy:**
1. Deploy embedding model as HTTP microservice (e.g., FastEmbed server)
2. Replace shell_exec with `Http::post()` calls
3. Add health check endpoint to microservice
4. Implement connection pooling and retry logic
5. Add queue for embedding requests

**Detection Checklist:**
- [ ] Are embedding calls HTTP (not shell_exec)?
- [ ] Is there a dedicated embedding microservice?
- [ ] Are PHP and Python processes decoupled?
- [ ] Is the embedding service health-monitored?

**Related Rules/Skills/Trees:**
- Rule: Use FastEmbed for Laravel Integration (`05-rules.md:1-31`)

---

## 2. No Quality Benchmark Against API Baseline

**Category:** Design

**Description:** Deploying local embedding models without benchmarking their retrieval quality against an API embedding baseline.

**Why It Happens:** Teams switch to local models to save costs or address privacy concerns. The quality difference between API and local models is known to exist but is assumed acceptable without measurement.

**Warning Signs:**
- Local model deployed without A/B test against API
- No recall comparison between API and local embeddings
- Search quality regression suspected but unquantified
- User complaints after switching to local models
- No baseline recall metrics before migration

**Why Harmful:** Local embedding models generally have lower quality than API models (OpenAI text-embedding-3-small). The gap varies by model and data domain. Without benchmarking, a 5-15% recall loss can go undetected, degrading search quality silently.

**Consequences:**
- 5-15% lower recall than API baseline
- Users finding fewer relevant results
- Cost savings at the expense of user satisfaction
- Hard to attribute quality loss to embedding model change

**Alternative:** Before switching to local models, benchmark recall@k against API baseline on a representative query set. Only deploy local if quality loss is within acceptable threshold.

**Refactoring Strategy:**
1. Collect representative query set from production
2. Generate embeddings with both API and local models
3. Benchmark recall@10, recall@100 for both
4. Accept local only if loss <5%
5. Add ongoing quality monitoring

**Detection Checklist:**
- [ ] Was local embedding quality benchmarked against API?
- [ ] Is the recall loss documented and acceptable?
- [ ] Are there ongoing quality comparisons?
- [ ] Is there a rollback plan if quality drops?

**Related Rules/Skills/Trees:**
- Rule: Benchmark Local vs API Embedding Quality (`05-rules.md:99-129`)

---

## 3. Full-Precision Model Without Quantization

**Category:** Performance

**Description:** Using full-precision (float32) local embedding models when ONNX-quantized versions provide 2-4× faster inference with <1% quality loss.

**Why It Happens:** Default model downloads are full-precision. Quantized models require explicit selection. Developers may not know quantized versions exist or may assume quality impact is significant.

**Warning Signs:**
- Model name does not include "quantized" or "int8"
- Inference is CPU-bound at 100% for embedding requests
- Indexing throughput is lower than expected
- Model file size is 2-4× larger than quantized alternative
- No model quantization evaluation

**Why Harmful:** Full-precision models use float32 weights, consuming more memory and CPU cycles. Quantized models (int8, uint8) run 2-4× faster on CPU with negligible quality loss (<1% for most benchmarks). The throughput penalty is paid on every embedding generation.

**Consequences:**
- 2-4× slower embedding generation
- Higher CPU utilization for same throughput
- Larger model download and storage
- Slower batch processing

**Alternative:** Use ONNX-quantized versions of embedding models (e.g., `BAAI/bge-small-en-quantized`). Benchmark quality against full-precision to confirm minimal loss.

**Refactoring Strategy:**
1. Identify current model and version
2. Download quantized version
3. Benchmark inference speed improvement
4. Benchmark recall vs full-precision
5. Switch to quantized if loss is acceptable

**Detection Checklist:**
- [ ] Is the model quantized (int8/uint8)?
- [ ] Was inference speed benchmarked against full-precision?
- [ ] Was recall loss measured?
- [ ] Is CPU utilization acceptable?

**Related Rules/Skills/Trees:**
- Rule: Quantize Models for Faster Inference (`05-rules.md:34-63`)

---

## 4. No Cache for Local Embeddings

**Category:** Performance

**Description:** Re-computing local embeddings for the same text instead of caching by content hash, wasting CPU cycles on redundant inference.

**Why It Happens:** Local embeddings don't have per-call cost (no API charge), so caching feels less critical. Developers overlook the CPU cost of redundant inference.

**Warning Signs:**
- Same text embedded multiple times in batch logs
- CPU utilization is higher than necessary
- No cache store configured for local embeddings
- Queue retries recompute embeddings from scratch
- Indexing throughput is CPU-bound

**Why Harmful:** While local embeddings have no monetary cost, they consume CPU time and increase latency. Each inference takes 10-100ms depending on model and hardware. Caching eliminates redundant computation, freeing CPU for actual work.

**Consequences:**
- Wasted CPU cycles on redundant inference
- Higher latency for repeated content
- Slower bulk indexing

**Alternative:** Cache locally generated embeddings by content hash using Redis or database, same as API embeddings.

**Refactoring Strategy:**
1. Add cache check before local embedding inference
2. Key by `md5($text . $model . $dimensions)`
3. Skip inference on cache hit
4. Monitor cache hit rate

**Detection Checklist:**
- [ ] Are local embeddings cached by content hash?
- [ ] Is cache hit rate monitored?
- [ ] Are repeated texts served from cache?
- [ ] Is CPU utilization reduced by caching?

**Related Rules/Skills/Trees:**
- Rule: Cache Local Embeddings (`05-rules.md:65-97`)
