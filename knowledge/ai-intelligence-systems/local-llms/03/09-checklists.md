# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** local-llms
**Knowledge Unit:** ku-03
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Benchmark on your specific task.
- [ ] Consider the context window budget.
- [ ] Match quantization to hardware.
- [ ] Monitor for quality regressions
- [ ] Prefer models with the same architecture
- [ ] Benchmark data exists for selected models (tokens/second, memory, perplexity).
- [ ] Context window memory is accounted for in memory calculations.
- [ ] Model licenses are compatible with the deployment use case.
- [ ] Rules for Local Model Serving & Scaling

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering
- [ ] Implement input validation, output sanitization, and PII handling
- [ ] Implement response caching with appropriate TTL and invalidation strategy

---

# Implementation Checklist

- [ ] Benchmark on your specific task.
- [ ] Consider the context window budget.
- [ ] Match quantization to hardware.
- [ ] Monitor for quality regressions
- [ ] Prefer models with the same architecture
- [ ] Test multiple quantization levels
- [ ] Rules for Local Model Serving & Scaling

---

# Performance Checklist

- [ ] Batch processing: quantized models benefit less from batching (dequantization dominates per-token cost).
- [ ] CPU vs. GPU: 4-bit models on CPU with llama.cpp achieve 5-15 t/s for 7B models; GPU achieves 30-60 t/s.
- [ ] Memory-optimal: 4-bit quantization fits a 70B model in ~40GB (one A100). FP16 would need ~140GB.
- [ ] Quantization overhead: 4-bit requires dequantization during inference, adding 5-15% overhead vs. FP16 native.
- [ ] Speed optimal: 8-bit quantization is faster than 4-bit on most hardware (less decompression overhead).

---

# Security Checklist

- [ ] License compliance:
- [ ] Model poisoning:
- [ ] Model provenance:
- [ ] Quantization integrity:
- [ ] Side-channel attacks:

---

# Reliability Checklist

- [ ] Ignoring context window memory â€” the model fits but the context window doesn't.
- [ ] Not benchmarking on the specific task â€” a model that scores high on MMLU may perform poorly on your use case.
- [ ] Selecting a model solely on parameter count â€” architecture matters (a well-trained 7B can outperform a poorly-trained 13B).
- [ ] Using a model that's too large for the available VRAM â€” causes swapping to system RAM, 10-100x slowdown.
- [ ] Using FP16 when 4-bit is sufficient â€” wastes 4x memory for marginal quality gain.

---

# Testing Checklist

- [ ] Benchmark data exists for selected models (tokens/second, memory, perplexity).
- [ ] Context window memory is accounted for in memory calculations.
- [ ] Model licenses are compatible with the deployment use case.
- [ ] Model provenance is verified (checksums, trusted sources).
- [ ] Model selection is based on task-specific benchmarking, not just parameter count.
- [ ] Quality regression tests run when model or quantization changes.
- [ ] Quantization level matches available hardware (RAM/VRAM).

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [[Bigger-is-Better Model Selection](#1-bigger-is-better-model-selection)]
- [ ] [[Quantization Obsession](#2-quantization-obsession)]
- [ ] [[No Benchmark Baseline for Model Changes](#3-no-benchmark-baseline-for-model-changes)]
- [ ] [[Vendor Lock-In to One Model Family](#4-vendor-lock-in-to-one-model-family)]
- [ ] [[Stale Model Selection](#5-stale-model-selection)]
- [ ] Bigger-is-Better:
- [ ] No Benchmark Baseline:
- [ ] Quantization Obsession:
- [ ] Stale Model Selection:
- [ ] Vendor Lock-In to One Model Family:

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


