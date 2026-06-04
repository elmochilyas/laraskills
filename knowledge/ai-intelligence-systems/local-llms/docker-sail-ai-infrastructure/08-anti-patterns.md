# Anti-Patterns: Docker Sail AI Infrastructure

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | KU-053 |
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Local LLM Development |
| **Type** | Implementation |
| **Version** | 1.0.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [GPU Passthrough Not Configured](#1-gpu-passthrough-not-configured)
2. [No Health Check for Ollama](#2-no-health-check-for-ollama)
3. [Not Pre-Pulling Models at Container Start](#3-not-pre-pulling-models-at-container-start)
4. [Insufficient Docker Resources](#4-insufficient-docker-resources)
5. [Docker Compose Assumed for Production](#5-docker-compose-assumed-for-production)

---

## 1. GPU Passthrough Not Configured

### Category
Performance Failure

### Description
Running Ollama in Docker without GPU passthrough configured, causing the model to run on CPU even when a GPU is available on the host. CPU inference is 5-50x slower than GPU inference for most models, making interactive AI features unusable. Developers wonder why "local AI is so slow" without checking GPU utilization.

### Why It Happens
- Docker GPU support requires explicit configuration (not automatic)
- NVIDIA Container Toolkit installation is an extra step
- macOS Docker Desktop doesn't support GPU passthrough
- Default docker-compose.yml doesn't include GPU configuration
- Developer assumes Docker uses GPU automatically

### Warning Signs
- Inference is CPU-bound (high CPU usage, low GPU usage)
- Response time >10 seconds for short outputs
- No NVIDIA tools in Ollama container (`nvidia-smi` not available)
- Docker Compose file missing `deploy.resources.reservations.devices` configuration
- Team complains that "local LLMs are too slow" without checking GPU usage

### Why Harmful
- Unacceptable latency for interactive features
- Developers avoid using local LLMs due to slowness
- Testing with local model is unrealistic (performance mismatch with production)
- Wasted GPU hardware that's available but not used
- Team attributes slowness to "Docker overhead" instead of missing GPU config

### Real-World Consequences
- Llama 3.2 8B takes 45 seconds per response in Docker (CPU)
- Same model runs in 3 seconds natively (GPU) — 15x faster
- Developer gives up on local LLM testing due to latency
- Feature testing with local model is skipped because "it's too slow"

### Preferred Alternative
Configure GPU passthrough explicitly in the Docker Compose file. Verify GPU is available inside the container. If GPU passthrough is not possible (macOS), run Ollama natively and connect via network.

### Refactoring Strategy
1. Add GPU reservation to the Ollama service in docker-compose.yml
2. Install NVIDIA Container Toolkit on the host
3. Verify GPU is accessible inside the container with `nvidia-smi`
4. If GPU passthrough is not possible, run Ollama natively (not in Docker)
5. Document GPU requirements in the project README

### Detection Checklist
- [ ] Docker Compose includes GPU passthrough configuration
- [ ] NVIDIA Container Toolkit is documented as a prerequisite
- [ ] GPU is verified inside the Ollama container
- [ ] Non-GPU environments have native Ollama as alternative

### Related Rules/Skills/Trees
- Skill: Implement Docker Sail AI Infrastructure

---

## 2. No Health Check for Ollama

### Category
Orchestration Failure

### Description
Not configuring a health check for the Ollama service in Docker Compose. The Laravel application container starts before Ollama is ready to serve requests, causing connection errors on the first AI calls. Developers manually restart containers or wait for Ollama to finish loading, wasting time and creating unreliable development experience.

### Why It Happens
- Health checks are an optional Docker Compose feature (easy to skip)
- Ollama starts quickly on fast hardware, making health checks seem unnecessary
- No awareness of Docker Compose service dependency ordering
- "It works after I restart" acceptance without digging into the root cause
- Default docker-compose.yml templates omit Ollama health checks

### Warning Signs
- First AI call after `docker compose up` fails with "Connection refused"
- Developers manually wait 10-30 seconds before using AI features
- Development environment setup instructions include "wait for Ollama"
- No `healthcheck` or `depends_on` with condition in docker-compose.yml
- Intermittent connection errors on container restart

### Why Harmful
- Frustrating developer experience: "AI is broken" on first use
- Wasted time: developers wait or restart containers
- New developers hit the issue immediately, bad first impression
- Unreliable: sometimes works, sometimes doesn't
- Debugging time wasted on connection errors that are actually timing issues

### Real-World Consequences
- New developer spends 30 minutes debugging "connection refused" before discovering the workaround
- Team member's dev environment needs manual restart every morning
- Automated setup scripts fail because they make AI calls too early
- Developers avoid restarting containers (stale environments)

### Preferred Alternative
Configure a health check for the Ollama service that verifies the API is responding. Use `depends_on` with `condition: service_healthy` in dependent services. Implement retry logic in the application for startup scenarios.

### Refactoring Strategy
1. Add health check to Ollama service: `curl -f http://localhost:11434/api/tags`
2. Configure `depends_on` with `condition: service_healthy` for dependent services
3. Add startup retry logic in the application's AI client (3 retries, exponential backoff)
4. Document the expected startup time (model-dependent: 2-30 seconds)
5. Add a startup progress indicator in the development environment

### Detection Checklist
- [ ] Health check is configured for Ollama service
- [ ] Dependent services wait for healthy Ollama
- [ ] Application has startup retry for AI connections
- [ ] Expected startup time is documented

### Related Rules/Skills/Trees
- Skill: Implement Docker Sail AI Infrastructure

---

## 3. Not Pre-Pulling Models at Container Start

### Category
Developer Experience Failure

### Description
Not pre-downloading required models during container build or startup. The first request to the model triggers an on-demand download that takes 2-10 minutes, during which the application appears broken or unresponsive. Every container restart requires re-downloading models if volumes aren't persisted.

### Why It Happens
- Dockerfile or entrypoint script doesn't include `ollama pull`
- Assumption that models will be downloaded once and cached in volumes
- No understanding of the model download time
- Development Docker setup copied from non-AI projects
- Focus on application code, not infrastructure setup

### Warning Signs
- First AI call takes 5 minutes instead of 5 seconds
- "Downloading model..." appears on first use
- Container restart requires model re-download
- No `ollama pull` command in Dockerfile or entrypoint
- Volume for model storage is not persisted

### Why Harmful
- Terrible first experience: new developers think AI is broken
- Wasted time: 2-10 minutes waiting for model download
- Container rebuilds (common in development) trigger re-download
- Team members avoid restarting containers to keep model cache
- CI pipeline times out waiting for model download

### Real-World Consequences
- Developer runs `sail up`, waits 8 minutes for model download
- `docker compose down -v` removes model volume, forces re-download
- CI job fails because model download exceeds 10-minute timeout
- Team keeps stale containers running to avoid model re-download

### Preferred Alternative
Pre-pull models in the Docker entrypoint script. Persist model storage volumes. Model download should happen during container build (not at runtime). If build-time download is too slow, ensure volumes survive container restarts.

### Refactoring Strategy
1. Create an entrypoint script that pulls required models before starting the app
2. Add `ollama pull llama3.2` (or configured model) to the entrypoint
3. Persist model volumes: named volume for `/root/.ollama`
4. Add build-time model caching for CI (pre-pulled image)
5. Document model download as a one-time setup step

### Detection Checklist
- [ ] Models are pre-pulled during container startup
- [ ] Model storage volume persists across restarts
- [ ] Entrypoint script handles model download
- [ ] CI pipeline has model caching or pre-pulled image

### Related Rules/Skills/Trees
- Skill: Implement Docker Sail AI Infrastructure

---

## 4. Insufficient Docker Resources

### Category
Resource Configuration Failure

### Description
Running Docker Desktop or Docker Engine with default resource limits (typically 2GB RAM) that are insufficient for running Ollama + PostgreSQL + Redis + the application simultaneously. Ollama alone needs 4-8GB for 7B-8B models, and the total stack requires 8-12GB. Default limits cause OOM kills, swapping, and unusably slow performance.

### Why It Happens
- Docker Desktop defaults to 2GB RAM (insufficient for AI workloads)
- No documentation of minimum resource requirements
- Team doesn't track resource usage during development
- macOS/Linux Docker memory limits are separate from host memory
- No awareness that Docker containers share host resources with limits

### Warning Signs
- Ollama container is killed with OOM error
- PostgreSQL performance degrades under load
- System becomes sluggish during AI development
- Docker diagnostics show memory pressure
- Containers restart unexpectedly
- "Everything was working and now it's slow" with no code changes

### Why Harmful
- Intermittent OOM kills make development unreliable
- System swapping makes everything slow
- Team cannot run the full AI stack simultaneously
- Developers disable some services (Redis, PostgreSQL) to save memory
- Inconsistent environment: works on one machine, not another

### Real-World Consequences
- Ollama container killed 3 times per hour due to OOM
- Developer can't run queue worker + Ollama simultaneously
- PostgreSQL queries slow to a crawl under memory pressure
- "Works on my machine" because only one developer has enough RAM allocated

### Preferred Alternative
Document minimum resource requirements. Configure Docker Desktop with at least 8GB RAM (16GB recommended). Use resource limits in Docker Compose to prevent one service from starving others. Monitor resource usage.

### Refactoring Strategy
1. Document minimum Docker resources: 8GB RAM, 4 CPU cores, 50GB disk
2. Configure Docker resource limits to at least 8GB (Docker Desktop settings)
3. Add resource reservations in docker-compose.yml for critical services
4. Monitor container resource usage with `docker stats`
5. Add resource requirement documentation to onboarding

### Detection Checklist
- [ ] Minimum resource requirements are documented
- [ ] Docker has at least 8GB RAM allocated
- [ ] Resource limits are configured in docker-compose.yml
- [ ] Container resource usage is monitored

### Related Rules/Skills/Trees
- Skill: Implement Docker Sail AI Infrastructure

---

## 5. Docker Compose Assumed for Production

### Category
Environment Confusion

### Description
Using the Docker Compose setup (designed for development) as a production deployment pattern. Docker Compose lacks the scalability, high availability, orchestration, and monitoring that production AI systems require. The development setup with single instances, no load balancing, and no backup becomes the production architecture.

### Why It Happens
- "Docker Compose works in development, so it works in production"
- No distinction between development and production infrastructure
- Quick initial deployment uses Docker Compose, never migrated
- Lack of DevOps expertise to set up proper orchestration (Kubernetes, Nomad)
- Pressure to ship quickly, planning to "fix it later"

### Warning Signs
- Docker Compose files are used in production deployments
- Single instances of all services (no redundancy)
- No orchestration platform (Kubernetes, Docker Swarm, Nomad)
- Production scaling means "run more docker-compose up"
- No zero-downtime deployments
- Monitoring and backup are afterthoughts

### Why Harmful
- No high availability: single instance failure takes down AI features
- No scaling: cannot handle traffic spikes
- Manual deployment process: slows updates and increases risk
- No rolling updates: deployments cause downtime
- No orchestration: container failures are not automatically recovered

### Real-World Consequences
- Production inference server crashes, no auto-recovery
- Traffic spike overwhelms single Ollama instance
- Deployment requires 10 minutes of downtime
- Backup restore is manual and not tested

### Preferred Alternative
Use Docker Compose for development only. For production, use proper orchestration (Kubernetes) or managed services (Laravel Cloud, managed PostgreSQL, managed inference). Keep the development and production architectures distinct.

### Refactoring Strategy
1. Design a production architecture that is NOT Docker Compose
2. Use managed services where possible (cloud provider inference, managed vector DB)
3. If self-hosting production, use Kubernetes or Nomad for orchestration
4. Implement proper health checks, auto-scaling, and rolling updates
5. Document the development vs. production architecture differences

### Detection Checklist
- [ ] Production does not use Docker Compose
- [ ] Orchestration platform exists for production (K8s, Nomad, managed service)
- [ ] Production has auto-scaling and high availability
- [ ] Development and production architectures are documented distinctly
