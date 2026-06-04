---
id: KU-053
title: "Docker Sail AI Infrastructure"
subdomain: "local-llms"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/13-local-llms/docker-sail-ai-infrastructure/04-standardized-knowledge.md"
---

# Docker Sail AI Infrastructure

## Overview

Docker Compose provides the infrastructure for local AI development: Ollama for LLM, PostgreSQL with pgvector for vector storage, Redis for caching/rate limiting, and a queue worker for async agent execution. Laravel Sail can be extended with Ollama and pgvector services for a complete local AI development environment in one command.

## Core Concepts

- **Laravel Sail**: Official Docker-based development environment for Laravel
- **Ollama service**: Docker container running local LLM inference
- **pgvector**: PostgreSQL extension for vector similarity search â€” requires custom PostgreSQL container
- **Redis**: Token budget storage, conversation cache, rate limiting counters
- **Queue worker**: Separate container for async agent execution
- **Single `sail up`**: Entire AI stack starts with one command

## When To Use

- Production applications requiring Docker Sail AI Infrastructure functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **GPU passthrough**: NVIDIA GPU to Ollama container for accelerated inference
- **Pre-pulled models**: Docker entrypoint script runs `ollama pull llama3.2` and `ollama pull nomic-embed-text`
- **Persistent volumes**: Model storage and vector data persist across container restarts
- **Health checks**: Verify Ollama and PostgreSQL are ready before Laravel container starts
- **Service profiles**: `sail up --profile ai` to start AI services only when needed

- **AiSail**: Like Laravel Sail but for AI development â€” single docker-compose.yml includes everything needed to run AI features locally.
- **Dev environment as code**: The entire AI infrastructure (LLM, vector DB, cache, queue) is defined in Docker Compose â€” new developer setup is `git clone && sail up`.

## Architecture Guidelines

- **Decision**: All-inclusive Docker Compose vs. separate tool installs â†’ Docker Compose for reproducibility, fresh developer setup in minutes. Native installs for performance-sensitive workflows (GPU passthrough may not work in all Docker configurations).
- **Decision**: pgvector Docker image vs. extension install â†’ `pgvector/pgvector:pg16` official image. Reason: Pre-installed extension, no additional setup.

## Performance Considerations

- Docker Ollama: GPU passthrough adds slight overhead vs. native (5-10% slower)
- Docker pgvector: negligible overhead vs. native PostgreSQL
- Shared volume performance: model storage on Docker volumes is slower than native filesystem
- Memory: Ollama container + PostgreSQL + Redis + app = 4-8GB RAM total

| Setup | Reproducibility | Performance | Complexity |
|-------|----------------|-------------|------------|
| Docker Compose (full) | Perfect | Moderate (container overhead) | Medium |
| Native install | Manual per developer | Best | Low |
| Mixed (Docker for DB, native Ollama) | Good | Good | Medium |

## Security Considerations

- Docker Compose is for development only â€” not production deployment
- Laravel Cloud provides managed PostgreSQL + pgvector, Reverb, queue workers â€” no Docker setup needed
- Forge: self-managed servers need pgvector extension installed directly
- Production: separate services (managed PostgreSQL, Reverb Cloud, etc.) instead of Docker Compose

## Common Mistakes

- Docker GPU passthrough not configured â€” Ollama runs on CPU, unusably slow
- No health check for Ollama â€” Laravel container starts before Ollama is ready, AI calls fail
- Not pre-pulling models â€” first request triggers model download, takes 2-10 minutes
- Insufficient Docker resources â€” Docker Desktop defaults to 2GB RAM, insufficient for Ollama + pgvector
- Volume permissions â€” Ollama model volume owned by wrong UID, can't write models

## Anti-Patterns

- **Ollama container OOM**: Default Docker Desktop 2GB limit insufficient for 7B+ models â€” increase to 8GB+
- **pgvector extension not loaded**: Using standard `postgres` image instead of `pgvector/pgvector` â€” vector columns can't be created
- **GPU not available**: Docker Desktop on macOS doesn't support GPU passthrough â€” Ollama runs CPU-only
- **Volume cache overwritten**: `docker compose down -v` removes model volumes â€” requires re-pull
- **Port conflict**: Local Ollama already running on port 11434 â€” Docker container fails to bind

## Examples

The following ecosystem packages provide reference implementations:

- Laravel Sail: base development environment for Laravel AI
- Official pgvector Docker image: `pgvector/pgvector:pg16`
- Ollama Docker image: `ollama/ollama`
- Community docker-compose templates for Laravel AI development

## Related Topics

- KU-050: Ollama Integration
- KU-028: pgvector Native Support
- KU-052: Dev-to-Prod Switching Strategy

## AI Agent Notes

- When asked about Docker Sail AI Infrastructure, first determine the specific use case and requirements.
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

