# Decomposition: Envoyer (Platform.sh)

## Topic Overview
Platform.sh as a Git-driven PaaS for Laravel. Covers three-file configuration model, branch-as-environment concept, hook ordering (build/deploy/post_deploy), worker management, and preview environment workflow.

## Decomposition Strategy
1. **Configuration model** — `.platform.app.yaml`, `routes.yaml`, `services.yaml` structure and interaction
2. **Branch-as-environment** — Git branch mapping, data cloning, environment isolation
3. **Hook lifecycle** — build hook, deploy hook, post_deploy hook — what runs where and when
4. **Service management** — database, Redis, Elasticsearch, worker containers as defined services
5. **Laravel integration** — config-reader package, mounts, env vars, optimized build

## Proposed Folder Structure
```
hosting-platforms/
├── envoyer/
│   ├── 02-knowledge-unit.md
│   ├── 03-decomposition.md
│   ├── 04-standardized-knowledge.md
│   └── templates/
│       ├── .platform.app.yaml
│       ├── routes.yaml
│       └── services.yaml
```

## Knowledge Unit Inventory
- KU-017: Fly.io Deployment — Docker-based multi-region
- KU-018: Railway Deployment — simple Git-push PaaS
- KU-019: Envoyer (Platform.sh) — Git-branch preview envs
- KU-020: Platform Selection — DO App Platform

## Dependency Graph
- **Prerequisites:** Git workflow, Laravel deployment basics
- **Related:** Fly.io (Docker alternative), Railway (simpler), Forge (VPS alternative)
- **Extends:** Single environment → branch-per-environment → full preview workflow

## Boundary Analysis
- **In scope:** Platform.sh config files, hook lifecycle, service management, Laravel integration
- **Out of scope:** Server-level management (no SSH), Dockerfile customization, multi-cloud hosting

## Future Expansion Opportunities
- Platform.sh cost optimization at scale
- Data cloning strategies for preview environments
- Platform.sh Blackfire.io integration for performance monitoring
