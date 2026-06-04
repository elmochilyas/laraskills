---
id: KU-050
title: "Ollama Integration"
subdomain: "local-llms"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/13-local-llms/ollama-integration/04-standardized-knowledge.md"
---

# Ollama Integration

## Overview

Ollama provides local open-source LLM inference, enabling zero-cost development, offline AI features, and privacy-sensitive workflows. The Laravel AI SDK includes Ollama as a first-class provider. The recommended pattern: Ollama locally (Llama 3.2, Qwen 2.5, Mistral), cloud provider in production, switched via `AI_PROVIDER` env var.

## Core Concepts

- **Local inference**: Models run on developer machine â€” no API calls, no cost, no data leaving network
- **Ollama provider**: Laravel AI SDK driver wrapping Ollama API (`http://localhost:11434`)
- **Model support**: Llama 3.2, Qwen 2.5 Coder, Mistral, DeepSeek, Phi-4, Gemini (via Ollama compatibility)
- **Anthropic API compatibility**: Ollama supports Anthropic-compatible API (`/api/anthropic/...`) for SDKs that target Anthropic format
- **GPU acceleration**: Apple Metal, NVIDIA CUDA, AMD ROCm support
- **Model management**: `ollama pull`, `ollama run`, `ollama list` CLI commands
- **Embedding models**: `nomic-embed-text`, `mxbai-embed-large` for local RAG development

## When To Use

- Production applications requiring Ollama Integration functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Env-switched provider**: `AI_PROVIDER=ollama` in `.env` for dev, `AI_PROVIDER=anthropic` in production
- **Model-specific config**: `AI_MODEL=llama3.2` for dev, `AI_MODEL=claude-sonnet-4` for production
- **Docker Compose setup**: `ollama/ollama` container alongside Laravel Sail
- **Pre-pulled models**: Dockerfile or setup script pulls required models on container start
- **Local RAG**: Use local embedding model + SQLite-vec for fully offline RAG development

- **Local MySQL for AI**: Like running MySQL on your dev machine â€” same code as production, different backend. Ollama is your "local database" for AI inference.
- **Development substitute**: Ollama replaces cloud providers during development â€” test prompts, iterate, debug without API costs. Switch to GPT-4/Claude in production.

## Architecture Guidelines

- **Decision**: Ollama vs. LM Studio vs. LocalAI â†’ Ollama for most users (simple CLI, broad model support). LM Studio for Windows GUI preference. LocalAI for Docker-native deployment.
- **Decision**: Local model for all features vs. subset â†’ Ollama for text generation and embeddings. Cloud provider for image/audio generation (not available locally).

## Performance Considerations

- Speed depends entirely on hardware: Apple M-series (fast), NVIDIA GPU (fast), CPU-only (slow)
- Llama 3.2 3B on M1: ~30 tokens/second (usable)
- Llama 3.2 8B on M1: ~15 tokens/second (acceptable)
- Mixtral 8x7B on CPU: ~2 tokens/second (too slow for interactive)
- Embedding models: fast (microseconds per text) â€” suitable for local RAG
- First load: model loads into RAM â€” takes 2-30 seconds depending on model size

| Factor | Ollama (Local) | Cloud Provider |
|--------|---------------|----------------|
| Cost | Free (compute only) | Per-token pricing |
| Model quality | Open models (good) | Frontier models (best) |
| Speed | Hardware-dependent | Fast inference servers |
| Context window | 8K-128K depending on model | Up to 200K |
| Tool calling | Model-dependent | Universal |
| Data privacy | Complete (local) | Data leaves network |
| Setup | CLI install + model download | API key only |

## Security Considerations

- Ollama is for development only â€” never use in production (no SLA, no scaling, no monitoring)
- Model download takes time â€” include in Docker build or setup script
- Different local models produce different quality â€” test prompts on the model closest to your production model
- Tool calling support varies by model â€” test tool use with your chosen local model
- Quantized models (Q4, Q8) trade quality for speed â€” use Q8 for development, Q4 for memory-constrained
- Ollama keeps models in RAM after loading â€” memory usage persists even when idle

## Common Mistakes

- Using different local model than production model â€” prompt may work with GPT-4 but fail with Llama 3.2
- Not testing tool calling locally â€” switching to production model that supports tools, but local model doesn't
- Expecting identical output between local and cloud â€” models are fundamentally different
- Running large models (70B) on developer machines without GPU â€” unusably slow
- Not embedding with same model as production â€” dimension mismatch if production embedding model differs
- Forgetting Ollama is running â€” consumes 2-8GB RAM continuously

## Anti-Patterns

- **Ollama server down**: `Connection refused` on localhost:11434 â€” SDK throws provider error
- **Model not pulled**: Requested model not downloaded â€” `ollama pull modelname` required
- **Out of memory**: Model too large for available RAM â€” Ollama crashes, use smaller/quantized model
- **Slow generation**: CPU-bound generation takes minutes â€” unacceptable for interactive use
- **Context window exceeded**: Local model context limit smaller than production model â€” truncate history

## Examples

The following ecosystem packages provide reference implementations:

- `shamimlaravel/Laravel-Local-LLM-SDK`: Alternative local LLM integration (supports Ollama + LM Studio)
- Laravel AI SDK: built-in Ollama provider since v0.1.0
- Ollama API: standard REST API used by PHP packages
- Docker Compose + Sail: standard development setup with Ollama container

## Related Topics

- KU-051: LM Studio & LocalAI
- KU-052: Dev-to-Prod Switching Strategy
- KU-053: Docker Sail AI Infrastructure

## AI Agent Notes

- When asked about Ollama Integration, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

