---
id: ku-04
title: "Offline & Air-Gapped Deployment"
subdomain: "local-llm-development"
ku-type: "deployment"
date-created: "2026-06-02"
domain-maturity: "emerging"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/local-llm-development/ku-04/04-standardized-knowledge.md"
---

# Offline & Air-Gapped Deployment

## Overview

Offline and air-gapped deployment of LLMs involves running models in environments without internet access — either by design (security/compliance) or due to connectivity constraints (remote locations, field operations). This requires pre-downloading all model artifacts, dependencies, and container images, and ensuring the system can operate entirely self-contained. In the Laravel AI ecosystem, this means the application, inference server, and models all reside on the same network without external API calls.

## Core Concepts

- **Air-Gapped Network:** A network physically or logically isolated from the internet. All software and data must be transferred via physical media.
- **Model Artifact Packaging:** Bundling model weights, tokenizer files, and configuration into a deployable package.
- **Dependency Mirroring:** Pre-downloading all required packages (Composer, npm, Docker images) into a local registry.
- **Self-Contained Inference:** The inference server runs entirely offline with no telemetry, license checks, or external calls.
- **Model Update Mechanism:** Process for updating models in air-gapped environments (physical transfer of new model files).
- **Offline Embeddings:** Using a local embedding model (instead of OpenAI's text-embedding-3-small) for RAG in air-gapped deployments.
- **Health & Monitoring:** All monitoring and alerting must be internal — no external SaaS (Datadog, Sentry).

## When To Use

- Classified or sensitive environments where data must not leave the facility.
- Compliance requirements (HIPAA, GDPR, ITAR, export control) that prohibit cloud AI usage.
- Remote or field deployments with unreliable or no internet connectivity.
- Industrial/enterprise environments with strict network security policies.
- Defense, intelligence, and government applications.

## When NOT To Use

- Standard cloud deployments (use cloud LLMs for better quality and lower operational overhead).
- When the compliance requirements can be met with cloud providers that offer data residency and zero-retention.
- When the operational cost of maintaining an air-gapped AI system exceeds the benefit.

## Best Practices

- **Pre-download everything.** Models, Docker images, Composer packages, system libraries — all must be available in the local network.
- **Use a local package registry.** Run a local Composer/Satis, npm registry, and Docker registry to serve dependencies.
- **Version model artifacts.** Tag model files with version numbers so deployments are reproducible.
- **Test the full offline deployment** in a sandbox that mirrors the air-gapped environment before shipping.
- **Document the deployment procedure** step-by-step — air-gapped environments often have limited access to external documentation.
- **Plan for model updates.** Air-gapped model updates require physical media transfer. Design a process for this.

## Architecture Guidelines

- All components (app, inference server, vector DB, cache) must run on the **same local network** with no external dependencies.
- Use **Docker Compose or Kubernetes** to define the full stack as a self-contained deployment unit.
- The inference server should have **no telemetry or license check calls** — some inference engines call home for usage reporting.
- Embeddings must be generated locally. Use a local embedding model (BGE, E5, Instructor) via Ollama or a dedicated embedding server.
- For RAG, the vector database must also be offline-compatible (Qdrant, Milvus, or pgvector — not Pinecone/Weaviate cloud).
- Use a **local monitoring stack** (Prometheus + Grafana) instead of cloud observability services.

## Performance Considerations

- Offline inference performance is identical to local inference — limited by available hardware.
- Model updates require physical media transfer. Plan for longer update cycles (weeks vs. minutes for cloud).
- Storage: model files are large (5-50GB per model). Ensure sufficient local storage with redundancy.
- No cloud elasticity: hardware capacity must be provisioned for peak load. Over-provisioning is required.
- Caching becomes more critical — every cache miss is a full inference call (no cloud bypass).

## Security Considerations

- **Physical security:** Model files contain valuable IP. Protect physical access to servers and storage media.
- **Data exfiltration:** Without internet, data exfiltration is harder but still possible (USB drives, printing). Monitor physical ports.
- **Model file checksums:** Verify every model file transferred to the air-gapped environment against known checksums.
- **Supply chain security:** All dependencies must be vetted before being brought into the air-gapped environment.
- **Secure boot and measured boot:** Ensure the hardware hasn't been tampered with (TPM, Secure Boot).
- **No emergency cloud fallback:** Since there's no internet, the system must handle all failure modes locally.

## Common Mistakes

- Discovering at deployment time that a dependency requires internet access (telemetry, license check, model download).
- Not pre-downloading all model quantization levels — after deployment, you can't download a different quantization.
- Forgetting to mirror non-model dependencies (Composer packages, Docker images, system libraries).
- Under-provisioning storage — model files plus logs plus vector DB data fill drives quickly.
- Not testing the full offline path — the application works on a dev machine with internet but fails in the air-gapped environment.

## Anti-Patterns

- **Hope-Based Deployment:** Assuming everything will work offline without testing. Every component must be verified in an offline sandbox.
- **Sneakernet for Every Update:** Requiring physical media transfer for minor updates. Batch updates into periodic releases.
- **No Monitoring:** Assuming air-gapped systems don't need monitoring. Internal monitoring is more important (no cloud support).
- **Single Point of Failure:** One inference server, one vector DB instance. Air-gapped systems need redundancy (harder to replace).
- **Stale Dependencies:** Never updating dependencies because it's hard. Schedule periodic update windows for the air-gapped environment.

## Examples

### Offline Stack Configuration
```yaml
# docker-compose.offline.yml
services:
  laravel-app:
    image: registry.local/app:latest
    environment:
      - LLM_PROVIDER=ollama
      - OLLAMA_URL=http://ollama:11434
      - EMBEDDING_PROVIDER=local
    depends_on: [ollama, qdrant, redis]

  ollama:
    image: registry.local/ollama:latest
    volumes:
      - ./models:/root/.ollama/models  # Pre-loaded models
    environment:
      - OLLAMA_HOST=0.0.0.0
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1

  qdrant:
    image: registry.local/qdrant:latest
    volumes:
      - ./qdrant_storage:/qdrant/storage

  redis:
    image: registry.local/redis:7-alpine
```

### Offline Deployment Checklist
```php
$offlineChecklist = [
    'models' => ['llama3.2:8b-q4', 'bge-small-en-v1.5'],  // Pre-downloaded
    'docker_images' => ['ollama', 'qdrant', 'redis', 'app'],
    'packages' => ['composer deps', 'npm deps'],           // Local mirror
    'artifacts' => ['model files', 'tokenizer files'],
    'config' => ['no telemetry', 'local monitoring'],
    'provisioning' => ['cpu', 'ram', 'vram', 'storage'],
];
```

## Related Topics

- ku-01 (Local LLM Setup): Foundation for offline deployment.
- ku-03 (Model Selection & Quantization): Pre-deployment model decisions.
- vector-database-integration/ku-03: Self-hosted vector DB for offline RAG.
- retrieval-augmented-generation/ku-07: RAG in air-gapped environments.
- ai-safety-security/ku-03: Security configuration for offline systems.

## AI Agent Notes

- When asked to design an offline deployment, first identify: regulatory requirements, hardware constraints, update frequency, and operational team capability.
- For offline deployment issues, check: dependency internet calls, model availability, and offline embedding support.
- Prefer reading the infrastructure configuration (Docker/Ansible) before the application code — infrastructure is the harder problem.
- When generating offline deployment code, include: dependency mirroring, model packaging, and full offline testing checklist.

## Verification

- [ ] All dependencies (models, Docker images, packages) are pre-downloaded and available locally.
- [ ] Inference server has no telemetry, license checks, or internet calls.
- [ ] Embeddings are generated by a local model (no cloud embedding API).
- [ ] Vector database runs locally (self-hosted Qdrant, Milvus, pgvector).
- [ ] Monitoring and alerting stack runs locally (Prometheus + Grafana).
- [ ] Full deployment has been tested in an offline sandbox environment.
- [ ] Model update procedure is documented, including physical media transfer process.
