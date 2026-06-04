# Anti-Patterns: Laravel Sail

## AP-SAIL-001: The Custom Fork
**Description:** Extensively customizing Sail with unique services and configurations that don't match the production environment.
**Consequences:** The development environment diverges from production. Issues that exist only in production are discovered after deployment.
**Remediation:** Mirror production service versions and configuration in Sail. If production uses a specific PostgreSQL version, Sail should too.

## AP-SAIL-002: Ignoring the sail Command
**Description:** Developers use `docker compose exec` or `docker exec` directly instead of the `sail` CLI.
**Consequences:** Miss Sail's convenience features. Inconsistent command syntax across the team.
**Remediation:** Add `sail` shell alias. Enforce `sail` prefix in team documentation.
