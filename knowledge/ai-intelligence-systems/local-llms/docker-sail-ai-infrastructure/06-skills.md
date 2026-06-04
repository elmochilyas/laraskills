# Skills

## Skill 1: Extend Laravel Sail with Ollama and pgvector for local AI development

### Purpose
Configure Docker Compose to run a complete local AI development stack with Laravel Sail extended with Ollama for local LLM inference, PostgreSQL with pgvector for vector similarity search, Redis for caching/rate limiting, and a queue worker for async agent execution.

### When To Use
- Use when setting up a local AI development environment with Docker
- Use when you need a single `sail up` command to start the entire AI stack
- Use when developing RAG (Retrieval-Augmented Generation) features locally
- Use when you need Redis for token budget storage, conversation cache, and rate limiting

### When NOT To Use
- Do NOT use without pinning Ollama image version and using a named volume for model persistence
- Do NOT use when you don't have sufficient disk space for Docker images and models (8-16GB+)
- Do NOT use when running on limited hardware (less than 8GB RAM) — Ollama needs significant resources
- Do NOT use without binding Ollama to localhost only (security risk if exposed)

### Prerequisites
- Laravel Sail installed and working (Docker Compose setup)
- Docker with sufficient resources (16GB+ RAM recommended)
- docker-compose.yml in the Laravel project root
- Understanding of Docker networking and volumes
- `sail` alias or shell function configured

### Inputs
- Laravel Sail's docker-compose.yml
- Ollama Docker image version
- pgvector Docker image (PostgreSQL + vector extension)
- Configuration environment variables

### Workflow
1. Extend docker-compose.yml with Ollama service:
   ```yaml
   ollama:
       image: ollama/ollama:0.3.12
       ports:
           - "127.0.0.1:11434:11434"
       volumes:
           - ollama-models:/root/.ollama
   ```
2. Add pgvector service:
   ```yaml
   pgvector:
       image: pgvector/pgvector:0.7.4-pg16
       environment:
           POSTGRES_PASSWORD: "${DB_PASSWORD}"
   ```
3. Add Redis service (if not already in Sail):
   ```yaml
   redis:
       image: redis:7-alpine
       ports:
           - "127.0.0.1:6379:6379"
   ```
4. Add queue worker service:
   ```yaml
   queue-worker:
       build:
           context: ./vendor/laravel/sail/runtimes/8.3
       command: php artisan queue:work
       depends_on:
           - redis
           - laravel-app
   ```
5. Configure environment variables:
   ```env
   AI_PROVIDER=ollama
   OLLAMA_HOST=http://ollama:11434
   DB_CONNECTION=pgsql
   DB_HOST=pgvector
   REDIS_HOST=redis
   ```
6. Start the stack: `sail up -d`
7. Pull the initial model: `sail exec ollama ollama pull llama3.2`
8. Test connectivity: `sail artisan tinker` then test AI call with Ollama provider

### Validation Checklist
- [ ] All services start with `sail up -d` (no missing dependencies)
- [ ] Ollama API responds: `curl http://localhost:11434/api/tags`
- [ ] pgvector supports vector operations: `CREATE EXTENSION vector;`
- [ ] Redis is accessible from Laravel
- [ ] Queue worker processes jobs
- [ ] Models persist across `sail down` and `sail up`
- [ ] Ollama API is only accessible from localhost (not public network)
- [ ] Environment variables correctly point to Docker service names
- [ ] Laravel app connects to all services
- [ ] Pulling a model works: `sail exec ollama ollama pull <model>`

### Common Failures
- **Model re-download**: No named volume for Ollama — every `sail down` loses models
- **Ollama exposed**: Port binding to `0.0.0.0` — anyone on network can use Ollama
- **Service dependency failure**: pgvector starts before PostgreSQL is ready — use healthcheck
- **Queue worker not processing**: Worker runs but can't connect to Redis — check network config
- **Ollama out of memory**: Pulling a large model on a small machine — choose model size carefully

### Decision Points
- **Ollama version**: Pin exact version, not `latest` — breaking changes occur
- **pgvector version**: Match PostgreSQL version in pgvector image to the project's database version
- **Model pre-pull**: Script model pulling into a setup command for new developers
- **Resource allocation**: Adjust Docker resource limits based on host machine capabilities

### Performance Considerations
- Ollama on Docker is slightly slower than native install (Docker networking overhead)
- GPU passthrough to Docker Ollama requires nvidia-container-toolkit
- pgvector indexes require memory — monitor with Vector memory limits
- Redis is fast (<1ms) for budget counters and cache — and uses minimal resources
- Queue worker should use the same PHP runtime as the main app

### Security Considerations
- Bind Ollama to 127.0.0.1 only — no authentication by default
- Redis password should be set in production, optional in dev
- pgvector should use strong password, not default
- Docker secrets for sensitive environment variables
- Don't expose queue worker port externally
- Regular `sail pull` updates for security patches

### Related Rules
- R1: Pin Ollama image version in docker-compose and use a named volume for model persistence
- R2: Never expose the Ollama API port to the public internet — bind to localhost only

### Related Skills
- Integrate Ollama for local LLM inference in Laravel
- Configure pgvector for vector similarity search
- Implement dev-to-prod provider switching strategy
- Configure Redis for token budget storage and rate limiting

### Success Criteria
- `sail up -d` starts all AI services without errors
- Models persist across container restarts (no re-download)
- Ollama API is accessible from Laravel but not from external network
- pgvector supports vector operations for RAG features
- Queue worker processes AI agent jobs asynchronously
- New developers can set up the complete AI stack with a single command
- Development stack resource usage is within host machine capacity
