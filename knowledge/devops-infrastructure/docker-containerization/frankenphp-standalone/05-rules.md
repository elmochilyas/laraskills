# Rules: FrankenPHP Standalone

## FRANKEN-001: Worker Count Configuration
**Condition:** FrankenPHP deployed for production
**Action:** Set `FRANKENPHP_WORKER_COUNT` to 2-4x CPU core count
**Rationale:** Worker count determines concurrent request handling capacity
**Consequences:** Violation causes CPU oversubscription or underutilization

## FRANKEN-002: Mercure JWT Secret
**Condition:** Mercure hub enabled in FrankenPHP
**Action:** Generate and set strong JWT secret for Mercure authentication
**Rationale:** Default Mercure configuration has no authentication
**Consequences:** Violation allows unauthorized event publishing to all connected clients

## FRANKEN-003: Use Official Docker Image
**Condition:** Containerizing FrankenPHP
**Action:** Use `dunglas/frankenphp` as base image
**Rationale:** Official image includes production-optimized PHP extensions and configuration
**Consequences:** Violation requires maintaining custom FrankenPHP build configuration
