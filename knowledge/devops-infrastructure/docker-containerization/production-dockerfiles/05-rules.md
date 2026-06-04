# Rules: Production Dockerfiles

## PROD-DOCKER-001: .dockerignore Required
**Condition:** Production Dockerfile in repository
**Action:** Create `.dockerignore` excluding .git, node_modules, tests, .env, and build artifacts
**Rationale:** Build context includes all files in directory; large irrelevant files inflate context size and may leak secrets
**Consequences:** Violation sends .env and node_modules to Docker daemon on every build

## PROD-DOCKER-002: HEALTHCHECK Instruction
**Condition:** Production Dockerfile
**Action:** Include `HEALTHCHECK` instruction that validates application health
**Rationale:** Container orchestrators need health status for load balancing and auto-restart
**Consequences:** Violation leaves orchestrator without health signals for pod management

## PROD-DOCKER-003: Non-Root User
**Condition:** Production runtime container
**Action:** Switch to non-root user before running application
**Rationale:** Container processes running as root can escape container and access host resources
**Consequences:** Violation enables privilege escalation on container compromise

## PROD-DOCKER-004: PHP Extension Audit
**Condition:** Production Dockerfile installs PHP extensions
**Action:** Only install extensions actually required by the application
**Rationale:** Unnecessary extensions increase attack surface and image size
**Consequences:** Violation ships unused PHP extensions with known CVEs
