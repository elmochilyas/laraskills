# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** local-llms
**Knowledge Unit:** dev-to-prod-switching
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] A/B provider comparison
- [ ] Dev/Prod parity for AI
- [ ] Feature-flag switching
- [ ] Local-first testing
- [ ] Provider per environment
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for Dev-to-Prod Provider Switching

---

# Architecture Checklist

- [ ] Local model for all features vs. selective â†’ Use local for text generation only. Image/audio features always route to cloud provider
- [ ] Single provider switch vs. per
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

- [ ] A/B provider comparison
- [ ] Dev/Prod parity for AI
- [ ] Feature-flag switching
- [ ] Local-first testing
- [ ] Provider per environment
- [ ] Provider-agnostic agent code
- [ ] Staging environment for AI
- [ ] Rules for Dev-to-Prod Provider Switching

---

# Performance Checklist

- [ ] Cloud models: 50-200 tok/s with fast inference APIs
- [ ] Cold start: local model first load = 2-30s; cloud API = 200-500ms
- [ ] Local models: 5-30 tok/s depending on hardware and model size
- [ ] Test suite: run against local model in CI (no API costs), selected integration tests against cloud

---

# Security Checklist

- [ ] CI should run tests with local provider (not cloud) â€” avoid API costs and flakiness in CI
- [ ] Consider "staging" environment with cheap cloud provider (GPT-4o-mini) between local and production (Claude Opus)
- [ ] Implement feature parity matrix â€” document which features work on local vs. cloud
- [ ] Monitor quality regression â€” local model quality changes with model updates
- [ ] Test every prompt against both local and production models â€” behavior differences can break features
- [ ] Use `#[BackupProvider]` or manual fallback â€” if production provider fails, fall back to local model (if available and acceptable quality)

---

# Reliability Checklist

- [ ] Assuming local model behavior matches production â€” prompts that work on GPT-4 may fail on Llama 3.2
- [ ] Forgetting to update AI_MODEL when switching providers â€” e.g., `AI_MODEL=llama3.2` with `AI_PROVIDER=anthropic` fails
- [ ] Mixed embedding dimensions â€” local embedding model has different dimensions than production
- [ ] No fallback for production provider outage â€” lose AI features entirely
- [ ] Testing only with local models â€” deploy to production, discovery that tools/structured output don't work

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
- [ ] Provider per environment
- [ ] Provider-agnostic agent code
- [ ] Staging environment for AI

---

# Anti-Pattern Prevention Checklist

- [ ] [[Assuming Local Model Behavior Matches Production](#1-assuming-local-model-behavior-matches-production)]
- [ ] [[No Fallback for Production Provider Outage](#2-no-fallback-for-production-provider-outage)]
- [ ] [[Testing Only with Local Models](#3-testing-only-with-local-models)]
- [ ] [[Mixed Embedding Dimensions Across Environments](#4-mixed-embedding-dimensions-across-environments)]
- [ ] [[Provider Override Conflict Surprises](#5-provider-override-conflict-surprises)]
- [ ] Env mismatch
- [ ] Feature gap
- [ ] Model not available
- [ ] Provider override conflict
- [ ] Quality cliff

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


