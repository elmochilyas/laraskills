# Knowledge Unit: Ollama Integration

## Metadata

- **ID:** KU-050
- **Subdomain:** Local LLM Development
- **Slug:** ollama-integration
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Ollama provides local open-source LLM inference, enabling zero-cost development, offline AI features, and privacy-sensitive workflows. The Laravel AI SDK includes Ollama as a first-class provider. The recommended pattern: Ollama locally (Llama 3.2, Qwen 2.5, Mistral), cloud provider in production, switched via `AI_PROVIDER` env var.

## Core Concepts

- **Local inference**: Models run on developer machine — no API calls, no cost, no data leaving network
- **Ollama provider**: Laravel AI SDK driver wrapping Ollama API (`http://localhost:11434`)
- **Model support**: Llama 3.2, Qwen 2.5 Coder, Mistral, DeepSeek, Phi-4, Gemini (via Ollama compatibility)
- **Anthropic API compatibility**: Ollama supports Anthropic-compatible API (`/api/anthropic/...`) for SDKs that target Anthropic format
- **GPU acceleration**: Apple Metal, NVIDIA CUDA, AMD ROCm support
- **Model management**: `ollama pull`, `ollama run`, `ollama list` CLI commands
- **Embedding models**: `nomic-embed-text`, `mxbai-embed-large` for local RAG development

## Mental Models

- **Local MySQL for AI**: Like running MySQL on your dev machine — same code as production, different backend. Ollama is your "local database" for AI inference.
- **Development substitute**: Ollama replaces cloud providers during development — test prompts, iterate, debug without API costs. Switch to GPT-4/Claude in production.

## Internal Mechanics

Ollama runs as a local HTTP server (port 11434). The Laravel AI SDK's Ollama driver:
- Connects to `http://localhost:11434/api/chat` (or configured URL)
- Supports `/api/chat` (chat completions), `/api/generate` (text completion), `/api/embeddings` (embeddings)
- Streams tokens via SSE — compatible with `->stream()`
- Tool calling: supported via Ollama's tool-call API (models must support it)
- Structured output: model-dependent — tested per model

## Patterns

- **Env-switched provider**: `AI_PROVIDER=ollama` in `.env` for dev, `AI_PROVIDER=anthropic` in production
- **Model-specific config**: `AI_MODEL=llama3.2` for dev, `AI_MODEL=claude-sonnet-4` for production
- **Docker Compose setup**: `ollama/ollama` container alongside Laravel Sail
- **Pre-pulled models**: Dockerfile or setup script pulls required models on container start
- **Local RAG**: Use local embedding model + SQLite-vec for fully offline RAG development

## Architectural Decisions

- **Decision**: Ollama vs. LM Studio vs. LocalAI → Ollama for most users (simple CLI, broad model support). LM Studio for Windows GUI preference. LocalAI for Docker-native deployment.
- **Decision**: Local model for all features vs. subset → Ollama for text generation and embeddings. Cloud provider for image/audio generation (not available locally).

## Tradeoffs

| Factor | Ollama (Local) | Cloud Provider |
|--------|---------------|----------------|
| Cost | Free (compute only) | Per-token pricing |
| Model quality | Open models (good) | Frontier models (best) |
| Speed | Hardware-dependent | Fast inference servers |
| Context window | 8K-128K depending on model | Up to 200K |
| Tool calling | Model-dependent | Universal |
| Data privacy | Complete (local) | Data leaves network |
| Setup | CLI install + model download | API key only |

## Performance Considerations

- Speed depends entirely on hardware: Apple M-series (fast), NVIDIA GPU (fast), CPU-only (slow)
- Llama 3.2 3B on M1: ~30 tokens/second (usable)
- Llama 3.2 8B on M1: ~15 tokens/second (acceptable)
- Mixtral 8x7B on CPU: ~2 tokens/second (too slow for interactive)
- Embedding models: fast (microseconds per text) — suitable for local RAG
- First load: model loads into RAM — takes 2-30 seconds depending on model size

## Production Considerations

- Ollama is for development only — never use in production (no SLA, no scaling, no monitoring)
- Model download takes time — include in Docker build or setup script
- Different local models produce different quality — test prompts on the model closest to your production model
- Tool calling support varies by model — test tool use with your chosen local model
- Quantized models (Q4, Q8) trade quality for speed — use Q8 for development, Q4 for memory-constrained
- Ollama keeps models in RAM after loading — memory usage persists even when idle

## Common Mistakes

- Using different local model than production model — prompt may work with GPT-4 but fail with Llama 3.2
- Not testing tool calling locally — switching to production model that supports tools, but local model doesn't
- Expecting identical output between local and cloud — models are fundamentally different
- Running large models (70B) on developer machines without GPU — unusably slow
- Not embedding with same model as production — dimension mismatch if production embedding model differs
- Forgetting Ollama is running — consumes 2-8GB RAM continuously

## Failure Modes

- **Ollama server down**: `Connection refused` on localhost:11434 — SDK throws provider error
- **Model not pulled**: Requested model not downloaded — `ollama pull modelname` required
- **Out of memory**: Model too large for available RAM — Ollama crashes, use smaller/quantized model
- **Slow generation**: CPU-bound generation takes minutes — unacceptable for interactive use
- **Context window exceeded**: Local model context limit smaller than production model — truncate history

## Ecosystem Usage

- `shamimlaravel/Laravel-Local-LLM-SDK`: Alternative local LLM integration (supports Ollama + LM Studio)
- Laravel AI SDK: built-in Ollama provider since v0.1.0
- Ollama API: standard REST API used by PHP packages
- Docker Compose + Sail: standard development setup with Ollama container

## Related Knowledge Units

- KU-051: LM Studio & LocalAI
- KU-052: Dev-to-Prod Switching Strategy
- KU-053: Docker Sail AI Infrastructure

## Research Notes

- Ollama usage in Laravel AI SDK: set `AI_PROVIDER=ollama`, `AI_MODEL=llama3.2`
- Ollama runs 100+ open-source models including recent Llama 3.2, Qwen 2.5, DeepSeek R1
- Ollama v0.14+ supports Anthropic-compatible API endpoint
- Model quantization recommended: Q8_0 for quality, Q4_K_M for memory efficiency
- Laravel recommended pattern: Ollama locally → cloud provider in production via env switch
