---
id: KU-043 (Local LLMs)
title: "Docker Sail AI Infrastructure - Rules"
subdomain: "local-llms"
ku-type: "infrastructure"
date-created: "2026-06-02"
---

## Rules for Docker Sail AI Infrastructure

### R1: Pin Ollama image version in docker-compose and use a named volume for model persistence
- **Category:** Infrastructure
- **Rule:** Specify the exact Ollama image version (`ollama/ollama:0.3.12`) in docker-compose.yml and mount a named Docker volume to `/root/.ollama` for model persistence; never use `latest` or anonymous volumes.
- **Reason:** Image updates can change Ollama behavior, API, or model compatibility. Named volumes ensure pulled models survive container restarts and rebuilds. Without persistence, every `sail down` forces a full model re-download.
- **Bad Example:** `image: ollama/ollama:latest` with no volume — after `sail down && sail up`, Ollama has no models and all dev AI features fail silently.
- **Good Example:** `image: ollama/ollama:0.3.12` with `volumes: - ollama-models:/root/.ollama`.
- **Exceptions:** CI/CD environments where fresh model downloads are desired.
- **Consequences of Violation:** Model re-download on every container restart (1-8GB downloads); silent service failure if no model is available; unexpected Ollama behavior from version upgrades.

### R2: Never expose the Ollama API port to the public internet — bind to localhost only
- **Category:** Security
- **Rule:** In docker-compose, bind the Ollama API port to `127.0.0.1:11434:11434`, not `0.0.0.0`; never allow external network access to the local LLM API.
- **Reason:** Ollama API has no authentication by default. Exposing it to the public network allows anyone on the same network to run models, access local data, and consume GPU resources without authorization.
- **Bad Example:** `ports: - "11434:11434"` in docker-compose — binds to 0.0.0.0, making Ollama accessible from any machine on the network.
- **Good Example:** `ports: - "127.0.0.1:11434:11434"` — only the host machine can access Ollama.
- **Exceptions:** Developer VMs where other team members need access.
- **Consequences of Violation:** Unauthorized model execution and GPU consumption; exposed local network service; potential data exfiltration via the Ollama prompt API.

### R3: Configure resource limits on the Ollama container to prevent it from starving other services
- **Category:** Infrastructure
- **Rule:** Set CPU and memory limits on the Ollama service container in docker-compose; never allow Ollama to use unlimited host resources.
- **Reason:** Local LLMs are resource-intensive. Without limits, a single model loading can consume all available RAM, causing Docker Desktop to kill other containers (database, queue, web server) and crash the development environment.
- **Bad Example:** An Ollama container with no memory limit loading a 70B model — the 16GB dev machine runs out of RAM, Docker kills MySQL, and the application shows database connection errors.
- **Good Example:** `deploy: resources: limits: memory: 8G, cpus: '4'` — Ollama is constrained to 8GB RAM and 4 CPU cores, preserving resources for other services.
- **Exceptions:** Dedicated development machines with sufficient resources for unlimited operation.
- **Consequences of Violation:** Whole development environment crashes when Ollama consumes all available RAM; other containers killed by Docker OOM killer; developer productivity lost to debugging infrastructure issues.
