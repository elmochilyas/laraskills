# Decomposition: Forge (Fly.io)

## Topic Overview
Fly.io as a Docker-based global hosting platform for Laravel. Covers Fly Machines, multi-region deployment, FrankenPHP integration, database connection pooling, and CI/CD with flyctl.

## Decomposition Strategy
1. **Fly Machines** — VM lifecycle, scaling, regions, cold start behavior
2. **Multi-region architecture** — anycast routing, active-passive DB, S3 storage, regional Redis
3. **FrankenPHP on Fly.io** — recommended runtime, single-container pattern, Octane integration
4. **Database management** — managed PostgreSQL/MySQL, connection pooling, multi-region replication
5. **CI/CD pipeline** — flyctl actions, secrets management, zero-downtime deploys

## Proposed Folder Structure
```
hosting-platforms/
├── forge/
│   ├── 02-knowledge-unit.md
│   ├── 03-decomposition.md
│   ├── 04-standardized-knowledge.md
│   └── templates/
│       ├── fly.toml
│       ├── Dockerfile.fly
│       └── multi-region-guide.md
```

## Knowledge Unit Inventory
- KU-017: Forge (Fly.io) — global Docker-based hosting
- KU-018: Vapor (Railway) — simple Git-push PaaS
- KU-019: Envoyer (Platform.sh) — Git-branch environments

## Dependency Graph
- **Prerequisites:** Docker basics, Laravel deployment
- **Related:** Railway (simpler Docker), Platform.sh (different model), Vapor (AWS)
- **Extends:** Single-server → Docker → multi-region global deployment

## Boundary Analysis
- **In scope:** Fly.io Machine model, multi-region patterns, FrankenPHP, CI/CD, managed databases
- **Out of scope:** Non-Docker hosting, single-region PaaS platforms, self-managed K8s

## Future Expansion Opportunities
- Multi-region PostgreSQL replication strategies
- Fly.io cost optimization at scale
- Migration patterns from single-region to multi-region
