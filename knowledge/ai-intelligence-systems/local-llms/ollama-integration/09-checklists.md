# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** local-llms
**Knowledge Unit:** ollama-integration
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Development substitute
- [ ] Docker Compose setup
- [ ] Env-switched provider
- [ ] Local MySQL for AI
- [ ] Local RAG
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for Ollama Integration

---

# Architecture Checklist

- [ ] Local model for all features vs. subset â†’ Ollama for text generation and embeddings. Cloud provider for image/audio generation (not available locally)
- [ ] Ollama vs. LM Studio vs. LocalAI â†’ Ollama for most users (simple CLI, broad model support). LM Studio for Windows GUI preference. LocalAI for Docker
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization

---

# Implementation Checklist

- [ ] Development substitute
- [ ] Docker Compose setup
- [ ] Env-switched provider
- [ ] Local MySQL for AI
- [ ] Local RAG
- [ ] Model-specific config
- [ ] Pre-pulled models
- [ ] Rules for Ollama Integration

---

# Performance Checklist

- [ ] Embedding models: fast (microseconds per text) â€” suitable for local RAG
- [ ] First load: model loads into RAM â€” takes 2-30 seconds depending on model size
- [ ] Llama 3.2 3B on M1: ~30 tokens/second (usable)
- [ ] Llama 3.2 8B on M1: ~15 tokens/second (acceptable)
- [ ] Mixtral 8x7B on CPU: ~2 tokens/second (too slow for interactive)
- [ ] Speed depends entirely on hardware: Apple M-series (fast), NVIDIA GPU (fast), CPU-only (slow)

---

# Security Checklist

- [ ] Different local models produce different quality â€” test prompts on the model closest to your production model
- [ ] Model download takes time â€” include in Docker build or setup script
- [ ] Ollama is for development only â€” never use in production (no SLA, no scaling, no monitoring)
- [ ] Ollama keeps models in RAM after loading â€” memory usage persists even when idle
- [ ] Quantized models (Q4, Q8) trade quality for speed â€” use Q8 for development, Q4 for memory-constrained
- [ ] Tool calling support varies by model â€” test tool use with your chosen local model

---

# Reliability Checklist

- [ ] Expecting identical output between local and cloud â€” models are fundamentally different
- [ ] Forgetting Ollama is running â€” consumes 2-8GB RAM continuously
- [ ] Not embedding with same model as production â€” dimension mismatch if production embedding model differs
- [ ] Not testing tool calling locally â€” switching to production model that supports tools, but local model doesn't
- [ ] Running large models (70B) on developer machines without GPU â€” unusably slow
- [ ] Using different local model than production model â€” prompt may work with GPT-4 but fail with Llama 3.2

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Performance implications are accounted for in the design.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.
- [ ] Security considerations are addressed.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Model-specific config

---

# Anti-Pattern Prevention Checklist

- [ ] [[Using Different Local and Production Models](#1-using-different-local-and-production-models)]
- [ ] [[Not Testing Tool Calling Locally](#2-not-testing-tool-calling-locally)]
- [ ] [[Expecting Identical Local and Cloud Output](#3-expecting-identical-local-and-cloud-output)]
- [ ] [[Running Large Models Without GPU](#4-running-large-models-without-gpu)]
- [ ] [[Embedding Dimension Mismatch](#5-embedding-dimension-mismatch)]
- [ ] Context window exceeded
- [ ] Model not pulled
- [ ] Ollama server down
- [ ] Out of memory
- [ ] Slow generation

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


