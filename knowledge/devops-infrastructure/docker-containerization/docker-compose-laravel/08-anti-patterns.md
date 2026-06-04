# Anti-Patterns: Docker Compose Laravel

## AP-DC-001: Production Composition
**Description:** Using the same `compose.yaml` for development and production without environment-specific overrides.
**Consequences:** Development configurations (bind mounts, debug settings, verbose logging) leak to production.
**Remediation:** Use `compose.yaml` for base configuration, `compose.override.yaml` for local development, separate production compose file.

## AP-DC-002: The Everything Container
**Description:** A single container running PHP, Nginx, MySQL, and Redis together.
**Consequences:** Defeats Docker's isolation benefits. Scaling requires scaling all services together.
**Remediation:** Separate services into distinct containers. Each container has one responsibility.
