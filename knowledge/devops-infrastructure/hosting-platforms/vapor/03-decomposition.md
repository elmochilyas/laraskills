# Decomposition: Vapor (Railway Deployment)

## Topic Overview
Railway as a zero-configuration Docker-based PaaS for Laravel. Covers Railpack auto-detection, service model (web/worker/cron), Git-push deployment, pre-deploy hooks, and monolith project architecture.

## Decomposition Strategy
1. **Railpack auto-detection** — buildpack analysis, PHP config, Composer/npm workflow
2. **Service model** — web service, worker service, cron service, managed database
3. **Git-push workflow** — repo connection, per-push deployments, deploy logs
4. **Pre-deploy hooks** — migration execution, failure handling, health checking
5. **Custom configuration** — `railway.json`, Dockerfile override, env vars

## Proposed Folder Structure
```
hosting-platforms/
├── vapor/
│   ├── 02-knowledge-unit.md
│   ├── 03-decomposition.md
│   ├── 04-standardized-knowledge.md
│   └── templates/
│       ├── railway.json
│       └── Dockerfile.railway
```

## Knowledge Unit Inventory
- KU-017: Fly.io Deployment — Docker-based multi-region
- KU-018: Vapor (Railway) — simple Git-push PaaS
- KU-019: Envoyer (Platform.sh) — Git-branch environments
- KU-020: Platform Selection — DO App Platform

## Dependency Graph
- **Prerequisites:** Git, Laravel deployment basics
- **Related:** Fly.io (Docker alternative), Platform.sh (advanced PaaS), Forge (VPS)
- **Extends:** Shared hosting → zero-config PaaS → managed VPS → container orchestration

## Boundary Analysis
- **In scope:** Railway deployment workflow, Railpack, service model, pre-deploy hooks, configuration
- **Out of scope:** Multi-region deployments, custom server config, non-Docker hosting

## Future Expansion Opportunities
- Railway vs Fly.io detailed cost comparison
- Custom Dockerfile patterns for Railway
- CI/CD integration beyond Git-push model
