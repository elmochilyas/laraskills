---
id: ku-01
title: "Local LLM Fundamentals - Rules"
subdomain: "local-llms"
ku-type: "foundation"
date-created: "2026-06-02"
---

## Rules for Local LLM Fundamentals

### R1: Choose a model size that fits your available VRAM/RAM with headroom for concurrent requests
- **Category:** Performance
- **Rule:** Before deploying any local model, verify its memory requirements against available hardware: for GPU, model must fit in VRAM with 20% headroom; for CPU, RAM must accommodate model + 4GB system overhead. Never use a model that exceeds available memory.
- **Reason:** Models that exceed available VRAM spill to system RAM (or crash on GPU), causing 10-50x latency degradation. Models that exceed system RAM cause swapping and OOM kills.
- **Bad Example:** Deploying Llama 3.1 70B (requires ~35GB VRAM) on a 12GB GPU — the model runs entirely on CPU at <1 token/second.
- **Good Example:** Selecting Llama 3.1 8B for a 12GB GPU (fits with 20% headroom), or Mistral 7B for a 8GB GPU.
- **Exceptions:** Batch-processing queues where sub-second latency is not required.
- **Consequences of Violation:** Unusable response times (<1 token/sec), frequent OOM crashes, or model swap thrashing that blocks other processes; development environment becomes unusable.

### R2: Always benchmark local model quality against your specific task before committing
- **Category:** Reliability
- **Rule:** Run a task-specific evaluation suite against any local model candidate before selecting it for production use; never rely on public benchmark scores (MMLU, HumanEval) alone.
- **Reason:** Public benchmarks measure general capability, not task-specific performance. A model with high MMLU may perform poorly on your specific JSON extraction or customer support task.
- **Bad Example:** Choosing a model because it scores #1 on the Open LLM Leaderboard — it performs poorly on the specific instruction-following task required by the application.
- **Good Example:** A custom eval suite with 50 representative prompts from the application; each candidate model scored on output quality, format compliance, and latency.
- **Exceptions:** Prototyping phases where any working model is acceptable.
- **Consequences of Violation:** Production quality is lower than expected despite good model benchmarks; investment in infrastructure for a model that doesn't serve the specific use case well.

### R3: Implement model health checks that run at container startup and periodically verify model availability
- **Category:** Reliability
- **Rule:** Configure a Docker health check (or Kubernetes liveness probe) that sends a test prompt to the local model and verifies a valid response within a timeout; never assume the model is ready because the container is running.
- **Reason:** Model loading takes 30 seconds to 5 minutes after container start. A model can also crash internally while the container remains running. Without health checks, the application connects to a non-responsive model.
- **Bad Example:** A web request arrives 30 seconds after `sail up` — Ollama container is running but the model (Llama 3.1 70B) hasn't finished loading. The first request times out.
- **Good Example:** A health check: `curl -X POST http://localhost:11434/api/generate -d '{"model": "llama3.1", "prompt": "hello", "stream": false}'` — container health is "unhealthy" until the model responds.
- **Exceptions:** When the application handles model-not-ready errors gracefully.
- **Consequences of Violation:** First requests fail or time out after deployments/restarts; application errors appear to users during model loading window; error budgets consumed by predictable startup delays.
