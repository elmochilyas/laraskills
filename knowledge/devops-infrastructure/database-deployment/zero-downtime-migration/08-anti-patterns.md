# Anti-Patterns: Zero-Downtime Migration

## AP-ZDM-001: Production-First Online Migration
**Description:** Running pt-osc or gh-ost on production for the first time without staging testing.
**Consequences:** Tool configuration issues, throttling problems, and unexpected behaviors discovered while migration is running on production data.
**Remediation:** Always test online schema change tools on staging with production-scale data first.

## AP-ZDM-002: No Throttle on Large Tables
**Description:** Running online schema change on multi-million row table without throttling.
**Consequences:** Migration consumes 100% disk I/O, degrading production query performance.
**Remediation:** Configure throttle thresholds. Limit I/O and replication lag during business hours.

## AP-ZDM-003: Overusing Online Tools
**Description:** Using pt-osc for every schema change, including trivial ones on small tables.
**Consequences:** Unnecessary complexity. pt-osc takes longer than standard ALTER on small tables.
**Remediation:** Use standard migrations for tables under 1M rows. Reserve online tools for genuinely large tables.
