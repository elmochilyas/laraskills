---
id: ku-03
title: "Local Model Serving & Scaling - Rules"
subdomain: "local-llms"
ku-type: "infrastructure"
date-created: "2026-06-02"
---

## Rules for Local Model Serving & Scaling

### R1: Always use a dedicated model server (Ollama, vLLM, llama.cpp) — never call the model binary directly
- **Category:** Architecture
- **Rule:** Run local models through a model server process that provides an HTTP API, handles request queuing, and manages GPU memory; never invoke model inference directly from PHP via shell_exec or exec.
- **Reason:** Model servers handle concurrent requests, GPU memory management, and model warm-up. Direct invocation blocks the PHP process for the entire inference duration (seconds to minutes), making the application unresponsive.
- **Bad Example:** A Laravel controller calling `exec("ollama run llama3.1 '{$prompt}'")` — the web server process blocks for 5-10 seconds, consuming a PHP-FPM worker.
- **Good Example:** A controller sending an HTTP request to `http://ollama:11434/api/generate` — the request is asynchronous, Ollama handles queuing, and the PHP process is freed quickly.
- **Exceptions:** CLI commands where blocking execution is acceptable.
- **Consequences of Violation:** PHP-FPM worker pool exhaustion under any concurrent load; application appears unresponsive because all workers are blocked on model inference.

### R2: Configure request queuing and concurrency limits on the model server for predictable behavior
- **Category:** Performance
- **Rule:** Set the model server's maximum concurrency to 1 (for single-GPU setups) with a request queue of max 10 pending requests; configure a timeout per request (e.g., 60s); never allow unlimited concurrent requests.
- **Reason:** Local models consume full GPU memory per inference. Two concurrent inferences on a single GPU cause OOM or severe thrashing (both run at 0.5x speed). Queuing provides predictable per-request latency.
- **Bad Example:** Ollama running with default settings, accepting unlimited concurrent requests — three simultaneous requests cause GPU OOM, and all three fail.
- **Good Example:** vLLM configured with `--max-num-seqs 1` and a 10-request queue. Ollama configured via `OLLAMA_NUM_PARALLEL=1` and `OLLAMA_MAX_LOADED_MODELS=1`.
- **Exceptions:** Multi-GPU setups where each GPU handles one concurrent request.
- **Consequences of Violation:** GPU memory exhaustion under concurrent load; all concurrent requests fail or degrade to unusable speeds; unpredictable performance under any real-world usage pattern.

### R3: Monitor model server resource usage and implement auto-scaling or manual scaling triggers
- **Category:** Observability
- **Rule:** Collect metrics from the model server (GPU utilization %, VRAM used, queue depth, request latency p50/p95) and set up Grafana dashboards with alerts; implement scaling when queue depth exceeds 5 for more than 1 minute.
- **Reason:** Local model serving is resource-constrained. Without monitoring, you don't know when GPU is saturated, VRAM is maxed, or queue depth is growing. Proactive scaling prevents user-facing degradation.
- **Bad Example:** A production deployment with no GPU monitoring — the team discovers the model is running at 100% GPU utilization for 2 hours only after users complain about slow responses.
- **Good Example:** A dashboard showing GPU mem (85%), queue depth (3), p95 latency (12s). Alert: "Queue depth > 5 for 1 min" triggers investigation or manual deployment of a second Ollama instance.
- **Exceptions:** Development environments where monitoring is not required.
- **Consequences of Violation:** Unnoticed GPU saturation causes cascading performance degradation; users experience increasing latency over time; team cannot identify the root cause without metrics.
