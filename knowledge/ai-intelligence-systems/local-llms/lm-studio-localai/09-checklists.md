# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** local-llms
**Knowledge Unit:** lm-studio-localai
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Custom base URL pattern
- [ ] Docker AI server
- [ ] Docker profile
- [ ] Fallback chain
- [ ] Model-specific config
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for LM Studio / LocalAI

---

# Architecture Checklist

- [ ] Custom base URL vs. dedicated adapter â†’ Custom base URL with OpenAI driver works for both LM Studio and LocalAI. Dedicated adapters for provider
- [ ] LM Studio vs. LocalAI vs. Ollama â†’ LM Studio for Windows developers (GUI). LocalAI for Docker
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Custom base URL pattern
- [ ] Docker AI server
- [ ] Docker profile
- [ ] Fallback chain
- [ ] Model-specific config
- [ ] Windows GUI for local LLMs
- [ ] Rules for LM Studio / LocalAI

---

# Performance Checklist

- [ ] All three: inference speed depends on model size and hardware â€” same models, similar speed
- [ ] LM Studio: good GPU acceleration on Windows (CUDA), macOS (Metal)
- [ ] LocalAI: container overhead adds slight latency vs. native Ollama
- [ ] Model loading time: LM Studio loads model on server start; LocalAI loads on first request
- [ ] Quantization: both support GGUF quantized models (Q4, Q5, Q8)

---

# Security Checklist

- [ ] All three: monitor RAM usage â€” local models consume 2-32GB depending on size
- [ ] LM Studio is strictly development â€” no production deployment model
- [ ] LocalAI can run in production for self-hosted AI (unlike LM Studio which is dev-only)
- [ ] LocalAI in production: Docker orchestration, GPU passthrough, persistent model storage

---

# Reliability Checklist

- [ ] Expecting OpenAI API compatibility for all features â€” embeddings and tools depend on model
- [ ] Installing LM Studio on server for production â€” it's a desktop GUI app
- [ ] Not configuring CORS â€” LM Studio server blocks cross-origin requests by default
- [ ] Running multiple local inference tools simultaneously â€” port conflicts
- [ ] Using LM Studio without GPU â€” CPU-only inference is 10-50x slower

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
- [ ] Custom base URL pattern
- [ ] Model-specific config

---

# Anti-Pattern Prevention Checklist

- [ ] [[Using LM Studio in Production](#1-using-lm-studio-in-production)]
- [ ] [[Running Without GPU Acceleration](#2-running-without-gpu-acceleration)]
- [ ] [[Expecting Full OpenAI API Compatibility](#3-expecting-full-openai-api-compatibility)]
- [ ] [[CORS Configuration Ignored](#4-cors-configuration-ignored)]
- [ ] [[Port Conflicts from Multiple Local Tools](#5-port-conflicts-from-multiple-local-tools)]
- [ ] API server not started
- [ ] CORS error
- [ ] GPU memory exhaustion
- [ ] Model not loaded
- [ ] Port conflict

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


