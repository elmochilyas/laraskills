# Decomposition: Platform Selection (DO App Platform)

## Topic Overview
DigitalOcean App Platform as a managed Laravel hosting solution. Covers buildpack deployment, `app.yaml` configuration, blue-green strategy, component model (web/worker/cron), and DO ecosystem integration.

## Decomposition Strategy
1. **Buildpack deployment** — auto-detection, PHP extension management, Composer/npm workflows
2. **`app.yaml` configuration** — build/run commands, health checks, instance sizing, environment variables
3. **Blue-green mechanism** — traffic switching, health check gates, rollback, deployment hooks
4. **Component model** — web service, worker service, cron service, managed databases
5. **DO ecosystem** — Spaces CDN, managed databases, monitoring, networking

## Proposed Folder Structure
```
hosting-platforms/
├── platform-selection/
│   ├── 02-knowledge-unit.md
│   ├── 03-decomposition.md
│   ├── 04-standardized-knowledge.md
│   └── templates/
│       ├── app.yaml
│       └── app-platform-migration-guide.md
```

## Knowledge Unit Inventory
- KU-017: Fly.io Deployment — Docker-based multi-region hosting
- KU-018: Railway Deployment — Git-push simple PaaS
- KU-019: Platform.sh Deployment — Git-branch preview envs
- KU-020: DO App Platform — DO ecosystem PaaS

## Dependency Graph
- **Prerequisites:** Laravel deployment basics, Git, GitHub
- **Related:** Railway (similar PaaS), Platform.sh (advanced), Forge (VPS management)
- **Extends:** Shared hosting → managed PaaS → VPS → container orchestration

## Boundary Analysis
- **In scope:** DO App Platform config, app.yaml patterns, blue-green deployment, component architecture
- **Out of scope:** Server-level config (no SSH), Dockerfile management, multi-region deployment

## Future Expansion Opportunities
- DO App Platform vs Forge on DO Droplets cost comparison
- CI/CD workflow templates for DO App Platform
- Migration guide from other PaaS to DO App Platform
