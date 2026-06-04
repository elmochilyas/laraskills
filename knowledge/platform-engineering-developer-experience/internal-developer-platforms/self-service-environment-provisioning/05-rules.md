# Rules: Self-Service Environment Provisioning

## Metadata
- **Source KU:** self-service-environment-provisioning
- **Domain:** Platform Engineering & Developer Experience
- **Subdomain:** Internal Developer Platforms
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- PROV-RULE-001: **Idempotent provisioning** — All scripts must be safe to re-run without side effects. Use `CREATE TABLE IF NOT EXISTS`, `php artisan migrate --force`, check-before-create logic.
- PROV-RULE-002: **Cattle, not pets** — Treat environments as disposable, replaceable resources. If an environment breaks, destroy and recreate.
- PROV-RULE-003: **Implement destroy with create** — Every create workflow must have a corresponding destroy workflow. TTL-based auto-cleanup prevents resource exhaustion.
- PROV-RULE-004: **Parity over speed** — Use same database version, queue driver, and service topology across all environments. Environment-specific bugs are hardest to debug.
- PROV-RULE-005: **Cache everything** — Pre-pull Docker images, cache Composer dependencies, pre-build images for common service combinations.

## Architecture Rules
- PROV-RULE-006: **Provisioning target selection** — Local Docker for dev environments. Forge/VPS for staging. Kubernetes for preview/PR environments.
- PROV-RULE-007: **Template-based configuration** — Store environment templates as YAML files in version control alongside application code.
- PROV-RULE-008: **Progressive provisioning** — Start with minimal environment (app + DB only), add services on demand. Reduces initial latency.
- PROV-RULE-009: **Data seeding profiles** — Support schema only (CI), dummy data (dev), anonymized production subset (staging), PR-specific scenarios (review).
- PROV-RULE-010: **Health verification** — Each provisioning step validates success. Final step pings app health endpoint and reports URL + credentials.
- PROV-RULE-011: **Resource quotas** — Enforce per-team and per-user limits on concurrent environments. Queue requests when at capacity.

## Implementation Rules
- PROV-RULE-012: **Local dev in < 60s** — app + DB should be running within 60 seconds. Full-service environment in < 3 minutes.
- PROV-RULE-013: **Remote staging in < 5 min** — Provisioning target. Preview environments in < 10 min.
- PROV-RULE-014: **Data seed optimization** — Seeders > 10 seconds use chunked seeding with progress reporting.

## Security Rules
- PROV-RULE-015: **No secrets in templates** — Never bake credentials into environment templates. Use Forge secrets, env-specific .env files, or vault integration.
- PROV-RULE-016: **Network isolation** — Provisioned environments isolated from production networks. Dev/staging cannot access production resources.
- PROV-RULE-017: **TTL-based auto-cleanup** — Feature branches: 48h max. Staging: 30d max. Automatic destruction.
- PROV-RULE-018: **Per-environment credentials** — Generated per provision and destroyed with the environment. No shared credentials across instances.
- PROV-RULE-019: **Audit trail** — All provisioning actions logged with actor, environment, timestamp.

## Performance Rules
- PROV-RULE-020: **Local provisioning: < 60s** for app + DB, < 3 min for full-service.
- PROV-RULE-021: **Remote staging: < 5 min**. Preview environments: < 10 min.
- PROV-RULE-022: **Warm pool** — Maintain pre-provisioned dev containers for instant assignment.

## Decision Rules
- PROV-RULE-023: **Provisioning justified** when developers spend > 30 minutes setting up local environments.
- PROV-RULE-024: **< 5 developers** — ad-hoc environments without automation are acceptable.

## Anti-Pattern Rules
- PROV-RULE-025: **Avoid the Snowflake Server** — Manually configured servers that can't be reproduced. Everything defined as code.
- PROV-RULE-026: **Avoid the Click-Ops Interface** — Portal requiring clicking through 20 options. Single command with smart defaults.
- PROV-RULE-027: **Avoid the Ticket-Backed Platform** — Self-service eliminates the dev → ticket → platform team cycle entirely.
- PROV-RULE-028: **Avoid the Stale Snapshot** — Database snapshots incompatible with current schema. Use fresh seeds or run migrations on restore.

## AI Guidance Rules
- PROV-RULE-029: When advising on provisioning, first understand current setup process, existing Docker/Forge usage, and specific service requirements.
- PROV-RULE-030: Never recommend Kubernetes for small teams. Don't suggest complex systems when Sail is sufficient.
