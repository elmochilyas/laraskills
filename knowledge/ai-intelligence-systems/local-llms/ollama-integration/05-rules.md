---
id: KU-045 (Local LLMs)
title: "Ollama Integration - Rules"
subdomain: "local-llms"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for Ollama Integration

### R1: Always use the Ollama PHP client library for API calls, not raw curl or shell_exec
- **Category:** Maintainability
- **Rule:** Use a dedicated Ollama PHP client package (e.g., the official or community package via Composer) for all API interactions; never call the Ollama API via raw curl or `shell_exec("ollama run ...")`.
- **Reason:** The PHP client handles request formatting, error handling, streaming response parsing, and connection management. Raw curl calls duplicate this work and miss edge cases (malformed responses, timeout handling).
- **Bad Example:** A custom `curl_exec` call to `http://localhost:11434/api/generate` with manual JSON parsing — crashes when Ollama changes a response field name.
- **Good Example:** `Ollama::client()->generate(model: 'llama3.1', prompt: $text)` — the client handles serialization, error codes, and response parsing.
- **Exceptions:** Prototyping or exploratory code that will be replaced by a client.
- **Consequences of Violation:** Brittle API integration that breaks on Ollama updates; error handling gaps cause silent failures; streaming responses are not properly consumed.

### R2: Never disable streaming in API calls without setting a reasonable timeout (≥60s)
- **Category:** Reliability
- **Rule:** When using non-streaming Ollama requests, set a PHP HTTP client timeout of at least 60 seconds (longer for large models); never use the default timeout (30s) which is too short for local model inference.
- **Reason:** Local model inference takes 10-60 seconds depending on model size and hardware. Default HTTP timeouts (30s) are designed for standard API calls, not LLM inference. Non-streaming requests with default timeout fail unpredictably.
- **Bad Example:** A non-streaming request to Ollama with default 30s timeout — a complex prompt on Llama 3.1 8B takes 35s to generate, and the request times out.
- **Good Example:** `Http::withOptions(['timeout' => 120])->post('http://ollama:11434/api/generate', ...)` — 120s timeout covers even the longest local model generation.
- **Exceptions:** Streaming requests where timeouts are per-chunk (much shorter).
- **Consequences of Violation:** Non-streaming LLM requests fail intermittently under load or for complex prompts; users see "Request timed out" errors; team concludes the local model is unreliable.

### R3: Implement model loading pre-warm for production — never serve cold-start requests to users
- **Category:** UX
- **Rule:** On application startup (or via a scheduled health check), send a dummy request to Ollama to ensure the model is loaded in memory before user traffic arrives; never let the first user request trigger the 10-60s model load.
- **Reason:** Ollama loads models lazily — the first request after container start triggers model loading, causing 10-60s latency. Users hitting a cold model have a terrible experience.
- **Bad Example:** The first user of the day requests a summary — Ollama loads the model from disk (35 seconds). The user sees a blank screen and navigates away.
- **Good Example:** A `php artisan ollama:warmup` command in the deployment hook that sends a warm-up request to each configured model. A health check also keeps models warm during idle periods.
- **Exceptions:** Low-traffic internal tools where warm-up cost isn't justified.
- **Consequences of Violation:** First user of the day or after deployment has a terrible experience (30-60s wait); users leave and form a negative impression; bounce rate increases.
