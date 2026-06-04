# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** local-llms
**Knowledge Unit:** docker-sail-ai-infrastructure
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] AiSail
- [ ] Dev environment as code
- [ ] GPU passthrough
- [ ] Health checks
- [ ] Persistent volumes
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for Docker Sail AI Infrastructure

---

# Architecture Checklist

- [ ] All
- [ ] pgvector Docker image vs. extension install â†’ `pgvector/pgvector:pg16` official image. Reason: Pre
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

- [ ] AiSail
- [ ] Dev environment as code
- [ ] GPU passthrough
- [ ] Health checks
- [ ] Persistent volumes
- [ ] Pre-pulled models
- [ ] Service profiles
- [ ] Rules for Docker Sail AI Infrastructure

---

# Performance Checklist

- [ ] Docker Ollama: GPU passthrough adds slight overhead vs. native (5-10% slower)
- [ ] Docker pgvector: negligible overhead vs. native PostgreSQL
- [ ] Memory: Ollama container + PostgreSQL + Redis + app = 4-8GB RAM total
- [ ] Shared volume performance: model storage on Docker volumes is slower than native filesystem

---

# Security Checklist

- [ ] Docker Compose is for development only â€” not production deployment
- [ ] Forge: self-managed servers need pgvector extension installed directly
- [ ] Laravel Cloud provides managed PostgreSQL + pgvector, Reverb, queue workers â€” no Docker setup needed
- [ ] Production: separate services (managed PostgreSQL, Reverb Cloud, etc.) instead of Docker Compose

---

# Reliability Checklist

- [ ] Docker GPU passthrough not configured â€” Ollama runs on CPU, unusably slow
- [ ] Insufficient Docker resources â€” Docker Desktop defaults to 2GB RAM, insufficient for Ollama + pgvector
- [ ] No health check for Ollama â€” Laravel container starts before Ollama is ready, AI calls fail
- [ ] Not pre-pulling models â€” first request triggers model download, takes 2-10 minutes
- [ ] Volume permissions â€” Ollama model volume owned by wrong UID, can't write models

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
- [ ] Dev environment as code
- [ ] Service profiles

---

# Anti-Pattern Prevention Checklist

- [ ] [[GPU Passthrough Not Configured](#1-gpu-passthrough-not-configured)]
- [ ] [[No Health Check for Ollama](#2-no-health-check-for-ollama)]
- [ ] [[Not Pre-Pulling Models at Container Start](#3-not-pre-pulling-models-at-container-start)]
- [ ] [[Insufficient Docker Resources](#4-insufficient-docker-resources)]
- [ ] [[Docker Compose Assumed for Production](#5-docker-compose-assumed-for-production)]
- [ ] GPU not available
- [ ] Ollama container OOM
- [ ] pgvector extension not loaded
- [ ] Port conflict
- [ ] Volume cache overwritten

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


