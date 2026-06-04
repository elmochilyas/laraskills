# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** local-llms
**Knowledge Unit:** ku-02
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Automate regression testing
- [ ] Record and replay responses
- [ ] Run prompt tests against both local and production models
- [ ] Set up a local model hot-swap
- [ ] Use local models for prompt structure iteration
- [ ] CI tests run deterministically without external API dependencies.
- [ ] Developer can switch between local and cloud models via environment variable.
- [ ] Environment-specific provider selection is configured (local uses Ollama, testing uses mock, staging/production use cloud).
- [ ] Rules for Model Selection & Benchmarking

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

- [ ] Automate regression testing
- [ ] Record and replay responses
- [ ] Run prompt tests against both local and production models
- [ ] Set up a local model hot-swap
- [ ] Use local models for prompt structure iteration
- [ ] Use the same provider abstraction
- [ ] Rules for Model Selection & Benchmarking

---

# Performance Checklist

- [ ] Consider using **smaller quantized models** for dev (3B-8B parameters) to keep response times acceptable.
- [ ] Developer experience: if local model inference takes >10 seconds per response, developers will avoid using it.
- [ ] Local model inference is slower than cloud models on most development hardware. Set timeout expectations accordingly.
- [ ] Model loading time: some inference engines load models lazily (first request is slow). Warm up the model at environment start.
- [ ] Parallel testing: running multiple local model instances for parallel test execution is memory-intensive. Use fixture replay for CI.

---

# Security Checklist

- [ ] API key isolation:
- [ ] CI secrets:
- [ ] Local model safety:
- [ ] Model file integrity:
- [ ] Test data sensitivity:

---

# Reliability Checklist

- [ ] Committing API keys in test configuration â€” use environment variables for all credentials.
- [ ] Not handling model unavailability â€” if the local model server is down, the development environment should fail gracefully.
- [ ] Not recording test fixtures â€” tests call real LLMs in CI, causing flaky, slow, and expensive test runs.
- [ ] Over-relying on local model quality â€” deploying prompts that only work with the local model.
- [ ] Using the same prompts for local and production without validation â€” behavior differences cause production issues.

---

# Testing Checklist

- [ ] CI tests run deterministically without external API dependencies.
- [ ] Developer can switch between local and cloud models via environment variable.
- [ ] Environment-specific provider selection is configured (local uses Ollama, testing uses mock, staging/production use cloud).
- [ ] LLM test fixtures are recorded and used in CI (no real LLM calls in test suite).
- [ ] Model file integrity is verified on download.
- [ ] Prompt evaluation suite exists with canonical test inputs and expected output characteristics.
- [ ] Test fixtures are version-controlled and reviewed alongside prompt changes.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Use local models for prompt structure iteration

---

# Anti-Pattern Prevention Checklist

- [ ] [[No Fixture Strategy for Tests](#1-no-fixture-strategy-for-tests)]
- [ ] [[Production-Local Divergence](#2-production-local-divergence)]
- [ ] [[Manual Prompt Testing Without Automation](#3-manual-prompt-testing-without-automation)]
- [ ] [[Local-Only Prompt Patterns](#4-local-only-prompt-patterns)]
- [ ] [[Ignoring Token Costs in Development](#5-ignoring-token-costs-in-development)]
- [ ] Ignoring Token Costs in Dev:
- [ ] Local-Only Prompting:
- [ ] Manual Prompt Testing:
- [ ] No Fixture Strategy:
- [ ] Production-Local Divergence:

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


