---
id: ku-01
title: "Local LLM Setup & Configuration"
subdomain: "local-llm-development"
ku-type: "setup"
date-created: "2026-06-02"
domain-maturity: "emerging"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/local-llm-development/ku-01/04-standardized-knowledge.md"
---

# Local LLM Setup & Configuration

## Overview

Local LLM setup covers the installation, configuration, and operation of LLMs on local hardware for development, testing, and offline use. Unlike cloud-based LLMs, local models run on the developer's machine or on-premise servers, offering zero per-request cost, complete data privacy, and offline availability. The tradeoffs are lower model quality (smaller models), higher latency on consumer hardware, and significant setup complexity. In the Laravel AI ecosystem, local LLMs are accessed through the same provider abstraction layer, with adapter implementations for Ollama, LM Studio, llama.cpp, and vLLM.

## Core Concepts

- **Local Runtime:** The software that hosts and serves the model (Ollama, llama.cpp, LM Studio, vLLM, LocalAI).
- **Model Quantization:** Compression technique that reduces model size and memory requirements at the cost of minor quality loss (4-bit, 8-bit, FP16).
- **Inference Engine:** The backend that runs model inference (llama.cpp, TensorRT-LLM, ONNX Runtime, MPS/CUDA).
- **Hardware Acceleration:** Using GPU (CUDA, MPS, Vulkan) or NPU for faster inference. CPU inference is significantly slower.
- **Model Registry:** A local or remote repository of model files (Ollama library, Hugging Face, LM Studio catalog).
- **Context Window:** Available context size is limited by available RAM/VRAM. Smaller local models typically have 4K-32K context.
- **Prompt Processing (Prefill):** The initial pass that processes the prompt. Dominates latency for long prompts.
- **Token Generation Speed:** Measured in tokens/second (t/s). Consumer GPUs achieve 10-50 t/s; CPUs achieve 2-10 t/s.

## When To Use

- Development and testing — iterate without provider API costs or rate limits.
- Privacy-sensitive applications where data must not leave the local network.
- Offline or air-gapped environments.
- Latency-sensitive applications where local inference is faster than network calls.
- Cost-sensitive production at scale (local inference has zero marginal cost).

## When NOT To Use

- Production applications requiring state-of-the-art model quality (local models lag behind cloud models by 1-2 generations).
- Applications needing very large context windows (100K+ tokens) — local hardware limits apply.
- High-throughput production systems without dedicated GPU infrastructure.
- Teams without DevOps/MLOps expertise to manage local model serving.

## Best Practices

- **Start with quantized models** (4-bit or 8-bit). Full-precision models require 2-4x more memory for marginal quality gain.
- **Match model size to hardware.** A 7B model needs ~4-6GB VRAM (4-bit), 13B needs ~8-10GB, 70B needs ~40-50GB.
- **Use a model server** with an OpenAI-compatible API (Ollama, vLLM, LocalAI). Avoid embedding the inference engine in the application process.
- **Benchmark before deploying.** Measure tokens/second, time-to-first-token, and peak memory usage for your hardware and model.
- **Monitor memory usage.** Local LLMs are memory-intensive. Set up memory monitoring to detect OOM conditions.
- **Keep models updated.** New quantizations and fine-tunes improve quality regularly.

## Architecture Guidelines

- Run the model server as a **separate process** or **Docker container**, not embedded in the PHP process.
- Access local models through the **same provider abstraction layer** as cloud models. The adapter points to `http://localhost:11434` instead of `https://api.openai.com`.
- Use **process supervisors** (systemd, supervisord) to keep the model server running and restart on crash.
- For production, use **vLLM** or **TGI** (Text Generation Inference) — they support continuous batching and higher throughput than Ollama.
- Separate **inference serving** from **application serving** — the Laravel app talks to the inference server over HTTP.

## Performance Considerations

- Time-to-first-token (TTFT) is the key metric for user-facing applications. GPU inference has TTFT of 100-500ms; CPU is 1-5s.
- Batch size of 1: most local LLM deployments serve one request at a time. vLLM's continuous batching improves throughput for concurrent requests.
- Quantization: 4-bit quantization reduces memory by 4x and improves throughput by 2-3x vs. FP16.
- Prompt caching: some inference engines (llama.cpp, vLLM) support KV-cache sharing for repeated prefixes.
- Concurrent requests: most local inference engines handle requests sequentially. vLLM and TGI support concurrent request queuing.

## Security Considerations

- **Model file integrity:** Verify checksums of downloaded model files. Use trusted sources (Hugging Face, official Ollama library).
- **API exposure:** The local inference server should bind to `127.0.0.1` (not `0.0.0.0`) to prevent external access.
- **Authentication:** If the inference server must be network-accessible, add API key authentication (Ollama doesn't support auth natively — use a reverse proxy).
- **Input sanitization:** Same injection risks as cloud models. Apply input/output sanitization regardless of deployment.
- **Model jailbreaking:** Local models may have less safety alignment than cloud models. Implement application-level content moderation.

## Common Mistakes

- Using a model that's too large for available hardware — crashes or extremely slow inference.
- Not using quantization — running FP16 models on consumer hardware wastes memory and performance.
- Running the inference engine in the same process as the web server — a crash takes down both.
- Not benchmarking — deploying a model that takes 30 seconds per response because it's CPU-only.
- Ignoring prompt processing time — focusing only on tokens/second while TTFT dominates user experience.

## Anti-Patterns

- **Model Hopping:** Switching between different local models without systematic quality evaluation.
- **CPU-Only Production:** Running local LLMs on CPU for production user-facing workloads. GPU is required for acceptable latency.
- **Over-Quantization:** Using 2-bit or 3-bit quantization that degrades quality beyond acceptable thresholds.
- **No Monitoring:** Running local LLMs without memory, latency, or throughput monitoring.
- **Manual Model Management:** Downloading and managing model files manually. Use a model registry (Ollama, Hugging Face).

## Examples

### Local Provider Configuration
```php
// config/ai.php
return [
    'providers' => [
        'ollama' => [
            'driver' => 'ollama',
            'base_url' => env('OLLAMA_URL', 'http://localhost:11434'),
            'default_model' => env('OLLAMA_MODEL', 'llama3.2:8b'),
            'timeout' => env('OLLAMA_TIMEOUT', 120),
        ],
        'vllm' => [
            'driver' => 'openai', // vLLM has OpenAI-compatible API
            'base_url' => env('VLLM_URL', 'http://localhost:8000/v1'),
            'api_key' => env('VLLM_API_KEY'), // optional
            'default_model' => env('VLLM_MODEL', 'mistral-7b'),
        ],
    ],
];
```

### Hardware Sizing
```php
class LocalModelSizer {
    public static function recommendModel(int $vramGB, bool $gpuAvailable): string {
        if (!$gpuAvailable) {
            return match(true) {
                $vramGB >= 32 => 'llama3.2:8b (quantized)',
                $vramGB >= 16 => 'phi-3:mini (quantized)',
                default => 'gemma:2b (quantized)',
            };
        }
        return match(true) {
            $vramGB >= 48 => 'llama3.1:70b (4-bit)',
            $vramGB >= 16 => 'llama3.2:8b (FP16)',
            $vramGB >= 8 => 'mistral:7b (4-bit)',
            default => 'phi-3:mini (4-bit)',
        };
    }
}
```

## Related Topics

- ku-02 (Development Workflow): Using local models for development.
- ku-03 (Model Selection & Quantization): Choosing the right local model.
- ku-04 (Offline & Air-Gapped Deployment): Running without internet access.
- llm-provider-abstraction/ku-01: Provider abstraction for local endpoints.
- prompt-engineering-systems/ku-05: Prompt patterns that work well with smaller local models.

## AI Agent Notes

- When asked to set up a local LLM, first determine: available hardware (RAM, VRAM, GPU), use case (dev vs. production), and quality requirements.
- For local LLM performance issues, check: quantization level, hardware acceleration, and concurrent request handling.
- Prefer reading the inference server configuration before the provider adapter — the server determines the API format.
- When generating local LLM setup code, include: hardware sizing recommendations, runtime configuration, and health check.

## Verification

- [ ] Local model server runs as a separate process from the application.
- [ ] Model size is appropriate for available hardware (RAM/VRAM).
- [ ] Quantization is used (4-bit or 8-bit for consumer hardware).
- [ ] Inference server binds to localhost only (127.0.0.1).
- [ ] Benchmark results exist for tokens/second and time-to-first-token.
- [ ] Memory usage is monitored with alerts for high utilization.
- [ ] Provider adapter points to local endpoint with appropriate timeout.
