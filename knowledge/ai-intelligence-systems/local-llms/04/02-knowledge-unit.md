# Knowledge Unit: Offline & Air-Gapped Deployment

## Metadata

- **ID:** ku-04
- **Subdomain:** Local LLMs
- **Slug:** offline---air-gapped-deployment
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Offline and air-gapped deployment of LLMs involves running models in environments without internet access â€” either by design (security/compliance) or due to connectivity constraints (remote locations, field operations). This requires pre-downloading all model artifacts, dependencies, and container images, and ensuring the system can operate entirely self-contained. In the Laravel AI ecosystem, this means the application, inference server, and models all reside on the same network without external API calls.

## Core Concepts

- **Air-Gapped Network:** A network physically or logically isolated from the internet. All software and data must be transferred via physical media.
- **Model Artifact Packaging:** Bundling model weights, tokenizer files, and configuration into a deployable package.
- **Dependency Mirroring:** Pre-downloading all required packages (Composer, npm, Docker images) into a local registry.
- **Self-Contained Inference:** The inference server runs entirely offline with no telemetry, license checks, or external calls.
- **Model Update Mechanism:** Process for updating models in air-gapped environments (physical transfer of new model files).
- **Offline Embeddings:** Using a local embedding model (instead of OpenAI's text-embedding-3-small) for RAG in air-gapped deployments.
- **Health & Monitoring:** All monitoring and alerting must be internal â€” no external SaaS (Datadog, Sentry).

## Mental Models

- **Air-Gapped Network:** A network physically or logically isolated from the internet. All software and data must be transferred via physical media.
- **Model Artifact Packaging:** Bundling model weights, tokenizer files, and configuration into a deployable package.
- **Dependency Mirroring:** Pre-downloading all required packages (Composer, npm, Docker images) into a local registry.


## Internal Mechanics

The internal mechanics of Offline & Air-Gapped Deployment follow established patterns within the Local LLMs domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Pre-download everything.** Models, Docker images, Composer packages, system libraries â€” all must be available in the local network.
- **Use a local package registry.** Run a local Composer/Satis, npm registry, and Docker registry to serve dependencies.
- **Version model artifacts.** Tag model files with version numbers so deployments are reproducible.
- **Test the full offline deployment** in a sandbox that mirrors the air-gapped environment before shipping.
- **Document the deployment procedure** step-by-step â€” air-gapped environments often have limited access to external documentation.
- **Plan for model updates.** Air-gapped model updates require physical media transfer. Design a process for this.

## Patterns

- **Pre-download everything.** Models, Docker images, Composer packages, system libraries â€” all must be available in the local network.
- **Use a local package registry.** Run a local Composer/Satis, npm registry, and Docker registry to serve dependencies.
- **Version model artifacts.** Tag model files with version numbers so deployments are reproducible.
- **Test the full offline deployment** in a sandbox that mirrors the air-gapped environment before shipping.
- **Document the deployment procedure** step-by-step â€” air-gapped environments often have limited access to external documentation.
- **Plan for model updates.** Air-gapped model updates require physical media transfer. Design a process for this.

## Architectural Decisions

- All components (app, inference server, vector DB, cache) must run on the **same local network** with no external dependencies.
- Use **Docker Compose or Kubernetes** to define the full stack as a self-contained deployment unit.
- The inference server should have **no telemetry or license check calls** â€” some inference engines call home for usage reporting.
- Embeddings must be generated locally. Use a local embedding model (BGE, E5, Instructor) via Ollama or a dedicated embedding server.
- For RAG, the vector database must also be offline-compatible (Qdrant, Milvus, or pgvector â€” not Pinecone/Weaviate cloud).
- Use a **local monitoring stack** (Prometheus + Grafana) instead of cloud observability services.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Offline inference performance is identical to local inference â€” limited by available hardware.
- Model updates require physical media transfer. Plan for longer update cycles (weeks vs. minutes for cloud).
- Storage: model files are large (5-50GB per model). Ensure sufficient local storage with redundancy.
- No cloud elasticity: hardware capacity must be provisioned for peak load. Over-provisioning is required.
- Caching becomes more critical â€” every cache miss is a full inference call (no cloud bypass).

## Production Considerations

- **Physical security:** Model files contain valuable IP. Protect physical access to servers and storage media.
- **Data exfiltration:** Without internet, data exfiltration is harder but still possible (USB drives, printing). Monitor physical ports.
- **Model file checksums:** Verify every model file transferred to the air-gapped environment against known checksums.
- **Supply chain security:** All dependencies must be vetted before being brought into the air-gapped environment.
- **Secure boot and measured boot:** Ensure the hardware hasn't been tampered with (TPM, Secure Boot).
- **No emergency cloud fallback:** Since there's no internet, the system must handle all failure modes locally.

## Common Mistakes

- Discovering at deployment time that a dependency requires internet access (telemetry, license check, model download).
- Not pre-downloading all model quantization levels â€” after deployment, you can't download a different quantization.
- Forgetting to mirror non-model dependencies (Composer packages, Docker images, system libraries).
- Under-provisioning storage â€” model files plus logs plus vector DB data fill drives quickly.
- Not testing the full offline path â€” the application works on a dev machine with internet but fails in the air-gapped environment.

## Failure Modes

- **Hope-Based Deployment:** Assuming everything will work offline without testing. Every component must be verified in an offline sandbox.
- **Sneakernet for Every Update:** Requiring physical media transfer for minor updates. Batch updates into periodic releases.
- **No Monitoring:** Assuming air-gapped systems don't need monitoring. Internal monitoring is more important (no cloud support).
- **Single Point of Failure:** One inference server, one vector DB instance. Air-gapped systems need redundancy (harder to replace).
- **Stale Dependencies:** Never updating dependencies because it's hard. Schedule periodic update windows for the air-gapped environment.

## Ecosystem Usage

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

## Related Knowledge Units

- ku-01 (Local LLM Setup): Foundation for offline deployment.
- ku-03 (Model Selection & Quantization): Pre-deployment model decisions.
- vector-database-integration/ku-03: Self-hosted vector DB for offline RAG.
- retrieval-augmented-generation/ku-07: RAG in air-gapped environments.
- ai-safety-security/ku-03: Security configuration for offline systems.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

