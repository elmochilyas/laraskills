# Knowledge Unit: Docker Sail AI Infrastructure

## Metadata

- **ID:** KU-053
- **Subdomain:** Local LLM Development
- **Slug:** docker-sail-ai-infrastructure
- **Version:** 1.0.0
- **Maturity: Stable** (Tier 4 — Adjacent)
- **Status:** Published

## Executive Summary

Docker Compose provides the infrastructure for local AI development: Ollama for LLM, PostgreSQL with pgvector for vector storage, Redis for caching/rate limiting, and a queue worker for async agent execution. Laravel Sail can be extended with Ollama and pgvector services for a complete local AI development environment in one command.

## Core Concepts

- **Laravel Sail**: Official Docker-based development environment for Laravel
- **Ollama service**: Docker container running local LLM inference
- **pgvector**: PostgreSQL extension for vector similarity search — requires custom PostgreSQL container
- **Redis**: Token budget storage, conversation cache, rate limiting counters
- **Queue worker**: Separate container for async agent execution
- **Single `sail up`**: Entire AI stack starts with one command

## Mental Models

- **AiSail**: Like Laravel Sail but for AI development — single docker-compose.yml includes everything needed to run AI features locally.
- **Dev environment as code**: The entire AI infrastructure (LLM, vector DB, cache, queue) is defined in Docker Compose — new developer setup is `git clone && sail up`.

## Internal Mechanics

Extended `docker-compose.yml` for AI development:

```yaml
services:
  laravel:
    # ... standard Sail app service
    environment:
      AI_PROVIDER: ollama
      AI_MODEL: llama3.2
      VECTOR_DB_CONNECTION: pgsql

  ollama:
    image: ollama/ollama
    volumes:
      - ollama-models:/root/.ollama
    ports:
      - 11434:11434
    command: serve
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: laravel_ai
    volumes:
      - pgvector-data:/var/lib/postgresql/data

  queue-worker:
    build: .
    command: php artisan queue:work --queue=ai-streaming,ai,default
    depends_on: [laravel, redis]
```

## Patterns

- **GPU passthrough**: NVIDIA GPU to Ollama container for accelerated inference
- **Pre-pulled models**: Docker entrypoint script runs `ollama pull llama3.2` and `ollama pull nomic-embed-text`
- **Persistent volumes**: Model storage and vector data persist across container restarts
- **Health checks**: Verify Ollama and PostgreSQL are ready before Laravel container starts
- **Service profiles**: `sail up --profile ai` to start AI services only when needed

## Architectural Decisions

- **Decision**: All-inclusive Docker Compose vs. separate tool installs → Docker Compose for reproducibility, fresh developer setup in minutes. Native installs for performance-sensitive workflows (GPU passthrough may not work in all Docker configurations).
- **Decision**: pgvector Docker image vs. extension install → `pgvector/pgvector:pg16` official image. Reason: Pre-installed extension, no additional setup.

## Tradeoffs

| Setup | Reproducibility | Performance | Complexity |
|-------|----------------|-------------|------------|
| Docker Compose (full) | Perfect | Moderate (container overhead) | Medium |
| Native install | Manual per developer | Best | Low |
| Mixed (Docker for DB, native Ollama) | Good | Good | Medium |

## Performance Considerations

- Docker Ollama: GPU passthrough adds slight overhead vs. native (5-10% slower)
- Docker pgvector: negligible overhead vs. native PostgreSQL
- Shared volume performance: model storage on Docker volumes is slower than native filesystem
- Memory: Ollama container + PostgreSQL + Redis + app = 4-8GB RAM total

## Production Considerations

- Docker Compose is for development only — not production deployment
- Laravel Cloud provides managed PostgreSQL + pgvector, Reverb, queue workers — no Docker setup needed
- Forge: self-managed servers need pgvector extension installed directly
- Production: separate services (managed PostgreSQL, Reverb Cloud, etc.) instead of Docker Compose

## Common Mistakes

- Docker GPU passthrough not configured — Ollama runs on CPU, unusably slow
- No health check for Ollama — Laravel container starts before Ollama is ready, AI calls fail
- Not pre-pulling models — first request triggers model download, takes 2-10 minutes
- Insufficient Docker resources — Docker Desktop defaults to 2GB RAM, insufficient for Ollama + pgvector
- Volume permissions — Ollama model volume owned by wrong UID, can't write models

## Failure Modes

- **Ollama container OOM**: Default Docker Desktop 2GB limit insufficient for 7B+ models — increase to 8GB+
- **pgvector extension not loaded**: Using standard `postgres` image instead of `pgvector/pgvector` — vector columns can't be created
- **GPU not available**: Docker Desktop on macOS doesn't support GPU passthrough — Ollama runs CPU-only
- **Volume cache overwritten**: `docker compose down -v` removes model volumes — requires re-pull
- **Port conflict**: Local Ollama already running on port 11434 — Docker container fails to bind

## Ecosystem Usage

- Laravel Sail: base development environment for Laravel AI
- Official pgvector Docker image: `pgvector/pgvector:pg16`
- Ollama Docker image: `ollama/ollama`
- Community docker-compose templates for Laravel AI development

## Related Knowledge Units

- KU-050: Ollama Integration
- KU-028: pgvector Native Support
- KU-052: Dev-to-Prod Switching Strategy

## Research Notes

- Standard docker-compose for Laravel AI development is not yet provided by Laravel officially
- Community templates exist but vary in quality — teams typically build their own
- GPU passthrough in Docker requires NVIDIA Container Toolkit (Linux) or no support (macOS)
- Apple Silicon users: Ollama runs natively (not in Docker) for better GPU utilization
- Laravel Cloud is the recommended production equivalent — managed infrastructure replaces Docker Compose
