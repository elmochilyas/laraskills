# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** local-llms
**Knowledge Unit:** ku-01
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Benchmark before deploying.
- [ ] Keep models updated.
- [ ] Match model size to hardware.
- [ ] Monitor memory usage.
- [ ] Start with quantized models
- [ ] Benchmark results exist for tokens/second and time-to-first-token.
- [ ] Inference server binds to localhost only (127.0.0.1).
- [ ] Local model server runs as a separate process from the application.
- [ ] Rules for Local LLM Fundamentals

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Benchmark before deploying.
- [ ] Keep models updated.
- [ ] Match model size to hardware.
- [ ] Monitor memory usage.
- [ ] Start with quantized models
- [ ] Use a model server
- [ ] Rules for Local LLM Fundamentals

---

# Performance Checklist

- [ ] Batch size of 1: most local LLM deployments serve one request at a time. vLLM's continuous batching improves throughput for concurrent requests.
- [ ] Concurrent requests: most local inference engines handle requests sequentially. vLLM and TGI support concurrent request queuing.
- [ ] Prompt caching: some inference engines (llama.cpp, vLLM) support KV-cache sharing for repeated prefixes.
- [ ] Quantization: 4-bit quantization reduces memory by 4x and improves throughput by 2-3x vs. FP16.
- [ ] Time-to-first-token (TTFT) is the key metric for user-facing applications. GPU inference has TTFT of 100-500ms; CPU is 1-5s.

---

# Security Checklist

- [ ] API exposure:
- [ ] Authentication:
- [ ] Input sanitization:
- [ ] Model file integrity:
- [ ] Model jailbreaking:

---

# Reliability Checklist

- [ ] Ignoring prompt processing time â€” focusing only on tokens/second while TTFT dominates user experience.
- [ ] Not benchmarking â€” deploying a model that takes 30 seconds per response because it's CPU-only.
- [ ] Not using quantization â€” running FP16 models on consumer hardware wastes memory and performance.
- [ ] Running the inference engine in the same process as the web server â€” a crash takes down both.
- [ ] Using a model that's too large for available hardware â€” crashes or extremely slow inference.

---

# Testing Checklist

- [ ] Benchmark results exist for tokens/second and time-to-first-token.
- [ ] Inference server binds to localhost only (127.0.0.1).
- [ ] Local model server runs as a separate process from the application.
- [ ] Memory usage is monitored with alerts for high utilization.
- [ ] Model size is appropriate for available hardware (RAM/VRAM).
- [ ] Provider adapter points to local endpoint with appropriate timeout.
- [ ] Quantization is used (4-bit or 8-bit for consumer hardware).

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [[Model Hopping Without Evaluation](#1-model-hopping-without-evaluation)]
- [ ] [[CPU-Only Production Inference](#2-cpu-only-production-inference)]
- [ ] [[Over-Quantization Degrading Quality](#3-over-quantization-degrading-quality)]
- [ ] [[No Monitoring for Local LLMs](#4-no-monitoring-for-local-llms)]
- [ ] [[Manual Model Management](#5-manual-model-management)]
- [ ] CPU-Only Production:
- [ ] Manual Model Management:
- [ ] Model Hopping:
- [ ] No Monitoring:
- [ ] Over-Quantization:

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


