# Rules: Docker Compose for Laravel

## Metadata
- **Source KU:** docker-compose-for-laravel
- **Subdomain:** Development Environments
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- DC-RULE-001: **Customize via .env, not docker-compose.yml** — Sail's file is regenerated on update; use env variables.
- DC-RULE-002: **Add services via extension** — New services go in docker-compose.yml alongside Sail's defaults.
- DC-RULE-003: **Use bind mounts for dev** — Code changes sync instantly (vs volumes requiring rebuild).
- DC-RULE-004: **Use health checks** — `depends_on` only waits for container start, not readiness.
- DC-RULE-005: **Set resource limits** — `deploy.resources.limits.memory` prevents one service starving others.
- DC-RULE-006: **Don't modify Sail's file directly** — Use `sail:publish` to customize Dockerfile.

## Decision Rules
- DC-RULE-007: **Use for all team-based Laravel projects** needing environment consistency.
- DC-RULE-008: **Docker Compose is for development only** — Production uses Forge/Vapor/k8s.
