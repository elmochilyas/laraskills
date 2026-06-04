---
id: KU-044 (Local LLMs)
title: "LM Studio / LocalAI - Rules"
subdomain: "local-llms"
ku-type: "infrastructure"
date-created: "2026-06-02"
---

## Rules for LM Studio / LocalAI

### R1: Always configure LocalAI with a persistent model cache volume to avoid re-download on restart
- **Category:** Infrastructure
- **Rule:** Mount a Docker volume to `/tmp/models` in LocalAI and configure `LocalAI_MODELS_PATH` environment variable; for LM Studio, note the model storage location and back up on upgrade; never lose model cache between restarts.
- **Reason:** LocalAI models are 1-8 GB downloads. Without persistence, every container restart or upgrade requires re-downloading all models, consuming time and bandwidth.
- **Bad Example:** LocalAI on Docker with no volume — `docker compose down` loses all models, next `up` triggers 30-minute downloads for 3 models.
- **Good Example:** `volumes: - localai-models:/tmp/models` and `environment: - LocalAI_MODELS_PATH=/tmp/models`. Models persist across restarts.
- **Exceptions:** CI/CD ephemeral environments where fresh downloads are acceptable.
- **Consequences of Violation:** Hours-long model downloads after every restart or upgrade; development delays; network bandwidth consumed unnecessarily.

### R2: Never use LM Studio's default HTTP server binding (localhost) for Docker-on-WSL access
- **Category:** Infrastructure
- **Rule:** When running LM Studio on Windows/WSL with Laravel in Docker, bind the LM Studio API to `0.0.0.0` (or the WSL network interface) so Docker containers can reach it; never leave it on `localhost` (127.0.0.1).
- **Reason:** Docker containers run in a separate network namespace. `127.0.0.1` inside a container refers to the container, not the host. Without binding to a network-accessible interface, containers cannot reach LM Studio.
- **Bad Example:** LM Studio running on `http://127.0.0.1:1234` with Laravel in Docker configured to use `http://localhost:1234` — connection refused because `localhost` in the container ≠ Windows host.
- **Good Example:** LM Studio settings → "Serve on all interfaces" (0.0.0.0:1234); Laravel configured with host IP `http://10.0.75.1:1234` (WSL's host reachable IP).
- **Exceptions:** Native Laravel (not Docker) development on the same machine as LM Studio.
- **Consequences of Violation:** Development environment cannot connect to the local model server; developers waste time debugging "connection refused" errors; workaround by running Laravel outside Docker.

### R3: Configure health checks for LocalAI/LM Studio as Docker dependencies (depends_on is not enough)
- **Category:** Infrastructure
- **Rule:** Make Laravel's `depends_on` conditional on a proper health check that pings the LocalAI/LM Studio API endpoint (`/v1/models`); verify the service is not just running but ready to serve.
- **Reason:** `depends_on` only ensures the container started, not that the model server is ready. LocalAI can take 30-120 seconds to load models after container start. Without health checks, dependent services start before the model is ready.
- **Bad Example:** `depends_on: - localai` — the Laravel container starts immediately, tries to connect to LocalAI, and gets "connection refused" because models haven't loaded.
- **Good Example:** Docker Compose: `localai: healthcheck: test: ["CMD", "curl", "-f", "http://localhost:8080/v1/models"]; interval: 10s; retries: 6`. Laravel: `depends_on: localai: condition: service_healthy`.
- **Exceptions:** Development only with small models that load in <5s.
- **Consequences of Violation:** Application starts with "AI unavailable" errors during the model loading window; startup scripts and deployments appear broken when they're just waiting for model load.
