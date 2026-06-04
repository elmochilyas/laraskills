# Decomposition: Offline & Air-Gapped Deployment

## Topic Overview

Offline and air-gapped deployment of LLMs involves running models in environments without internet access â€” either by design (security/compliance) or due to connectivity constraints (remote locations, field operations). This requires pre-downloading all model artifacts, dependencies, and container images, and ensuring the system can operate entirely self-contained. In the Laravel AI ecosystem, this means the application, inference server, and models all reside on the same network without external API calls.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-04/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Offline & Air-Gapped Deployment
- **Purpose:** Offline and air-gapped deployment of LLMs involves running models in environments without internet access â€” either by design (security/compliance) or due to connectivity constraints (remote locations, field operations). This requires pre-downloading all model artifacts, dependencies, and container images, and ensuring the system can operate entirely self-contained. In the Laravel AI ecosystem, this means the application, inference server, and models all reside on the same network without external API calls.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-03, ku-03, ku-07, ku-03

## Dependency Graph
**Depends on:**
- ku-01
- ku-03
- ku-03
- ku-07
- ku-03

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Air-Gapped Network:** A network physically or logically isolated from the internet. All software and data must be transferred via physical media.
- **Model Artifact Packaging:** Bundling model weights, tokenizer files, and configuration into a deployable package.
- **Dependency Mirroring:** Pre-downloading all required packages (Composer, npm, Docker images) into a local registry.
- **Self-Contained Inference:** The inference server runs entirely offline with no telemetry, license checks, or external calls.
- **Model Update Mechanism:** Process for updating models in air-gapped environments (physical transfer of new model files).
- **Offline Embeddings:** Using a local embedding model (instead of OpenAI's text-embedding-3-small) for RAG in air-gapped deployments.
- **Health & Monitoring:** All monitoring and alerting must be internal â€” no external SaaS (Datadog, Sentry).

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-03 topics covered in their respective KUs
- ku-03 topics covered in their respective KUs
- ku-07 topics covered in their respective KUs
- ku-03 topics covered in their respective KUs

## Future Expansion Opportunities
The topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded
- No major concept is missing
- Boundaries are clear
- Future phases can operate on individual units
- The structure can scale without reorganization

